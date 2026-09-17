import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, FolderDown, Plus, Copy, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  canWriteToFolder,
  downloadZip,
  installToFolder,
  TARGETS,
  type Target,
} from "@/lib/install";
import {
  countCheats,
  createSet,
  deleteSet,
  duplicateSet,
  getActiveSet,
  removeCheat,
  removeGame,
  setActive,
  updateCheat,
  updateSet,
  useWorkspace,
  type CheatSet,
} from "@/lib/sets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Cheat set builder — Cheat Forge" },
      {
        name: "description",
        content:
          "Assemble per-client Switch cheat sets, edit code lines and install them into Eden or download a ZIP.",
      },
      { property: "og:title", content: "Cheat set builder — Cheat Forge" },
      {
        property: "og:description",
        content: "Build, edit and install custom Switch cheat sets for each client.",
      },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  const ws = useWorkspace();
  const active = getActiveSet(ws);
  const [target, setTarget] = useState<Target>("eden");
  const [canWrite, setCanWrite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => setCanWrite(canWriteToFolder()), []);

  async function handleInstall() {
    if (!active) return;
    setBusy(true);
    try {
      const { written, folder } = await installToFolder(active, target);
      toast.success(`Wrote ${written} cheat file${written === 1 ? "" : "s"} into ${folder}`);
    } catch (err) {
      if ((err as DOMException)?.name !== "AbortError") {
        toast.error("Could not write to that folder. Check you picked a writable location.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleZip() {
    if (!active) return;
    setBusy(true);
    try {
      const n = await downloadZip(active, target);
      toast.success(`Packaged ${n} cheat file${n === 1 ? "" : "s"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            cheat sets
          </h2>
          <Button size="sm" variant="secondary" onClick={() => createSet()}>
            <Plus className="size-4" /> New
          </Button>
        </div>
        {ws.sets.length === 0 && (
          <p className="panel p-4 text-sm text-muted-foreground">
            No sets yet. Create one, then add cheats from any game page.
          </p>
        )}
        {ws.sets.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`panel block w-full p-3 text-left transition-colors ${
              active?.id === s.id ? "border-primary/60" : "hover:border-border"
            }`}
          >
            <span className="block truncate text-sm font-semibold">{s.name}</span>
            <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
              {s.client ? `${s.client} · ` : ""}
              {countCheats(s)} cheats · {s.games.length} game{s.games.length === 1 ? "" : "s"}
            </span>
          </button>
        ))}
      </aside>

      {!active ? (
        <section className="panel flex flex-col items-center justify-center p-12 text-center">
          <h1 className="text-xl font-bold">Nothing to build yet</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Create a set, then search a game and add cheats to it.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Browse games</Link>
          </Button>
        </section>
      ) : (
        <section className="space-y-5">
          <SetHeader set={active} />

          <div className="panel space-y-4 p-5">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              install
            </h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TARGETS) as Target[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    target === t
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {TARGETS[t].label}
                </button>
              ))}
            </div>
            <p className="code-block">{TARGETS[target].hint}</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy || countCheats(active) === 0 || !canWrite} onClick={handleInstall}>
                <FolderDown className="size-4" /> Write to folder
              </Button>
              <Button
                variant="secondary"
                disabled={busy || countCheats(active) === 0}
                onClick={handleZip}
              >
                <Download className="size-4" /> Download ZIP
              </Button>
              <Button asChild variant="ghost">
                <Link to="/help">Where do these go?</Link>
              </Button>
            </div>
            {!canWrite && (
              <p className="text-xs text-muted-foreground">
                Direct folder writing needs Chrome, Chromium, Brave or Edge. In Firefox, use the ZIP.
              </p>
            )}
          </div>

          {active.games.length === 0 ? (
            <p className="panel p-6 text-sm text-muted-foreground">
              This set is empty.{" "}
              <Link to="/" className="text-primary underline underline-offset-4">
                Find a game
              </Link>{" "}
              and add some cheats.
            </p>
          ) : (
            active.games.map((game) => (
              <article key={`${game.titleId}-${game.buildId}`} className="panel p-5">
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to="/game/$titleId"
                      params={{ titleId: game.titleId }}
                      className="font-semibold hover:text-primary"
                    >
                      {game.titleName}
                    </Link>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {game.titleId} · build {game.buildId} · {game.cheats.length} cheats
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGame(active.id, game.titleId, game.buildId)}
                  >
                    <X className="size-4" /> Remove game
                  </Button>
                </header>

                <ul className="mt-4 space-y-2">
                  {game.cheats.map((cheat) => (
                    <CheatRow
                      key={cheat.id}
                      setId={active.id}
                      titleId={game.titleId}
                      buildId={game.buildId}
                      cheat={cheat}
                    />
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}

function SetHeader({ set }: { set: CheatSet }) {
  return (
    <div className="panel space-y-3 p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            set name
          </span>
          <Input
            value={set.name}
            onChange={(e) => updateSet(set.id, (s) => ({ ...s, name: e.target.value }))}
          />
        </label>
        <label className="space-y-1.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            client
          </span>
          <Input
            value={set.client}
            placeholder="Who is this for?"
            onChange={(e) => updateSet(set.id, (s) => ({ ...s, client: e.target.value }))}
          />
        </label>
      </div>
      <Textarea
        rows={2}
        value={set.notes}
        placeholder="Notes — game version, requests, what you changed…"
        onChange={(e) => updateSet(set.id, (s) => ({ ...s, notes: e.target.value }))}
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto font-mono text-[11px] text-muted-foreground">
          {countCheats(set)} cheats · saved on this machine
        </span>
        <Button variant="ghost" size="sm" onClick={() => duplicateSet(set.id)}>
          <Copy className="size-4" /> Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteSet(set.id)}
        >
          <Trash2 className="size-4" /> Delete set
        </Button>
      </div>
    </div>
  );
}

function CheatRow({
  setId,
  titleId,
  buildId,
  cheat,
}: {
  setId: string;
  titleId: string;
  buildId: string;
  cheat: { id: string; name: string; codes: string[]; custom?: boolean };
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cheat.name);
  const [codes, setCodes] = useState(cheat.codes.join("\n"));

  function save() {
    updateCheat(setId, titleId, buildId, cheat.id, {
      name: name.trim() || "Unnamed",
      codes: codes
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean),
    });
    setEditing(false);
    toast.success("Cheat updated");
  }

  return (
    <li className="rounded-md border border-border bg-background/40 p-3">
      {editing ? (
        <div className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            rows={5}
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save}>
              <Save className="size-4" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {cheat.name}
              {cheat.custom && (
                <span className="ml-2 rounded bg-signal/15 px-1.5 py-0.5 font-mono text-[10px] uppercase text-signal">
                  custom
                </span>
              )}
            </p>
            <pre className="code-block mt-1 max-h-24 overflow-hidden whitespace-pre-wrap">
              {cheat.codes.slice(0, 3).join("\n")}
              {cheat.codes.length > 3 ? `\n… +${cheat.codes.length - 3} lines` : ""}
            </pre>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeCheat(setId, titleId, buildId, cheat.id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
