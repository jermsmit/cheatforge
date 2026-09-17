import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Copy, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { loadTitle, normalize, parseCheatText, type Cheat } from "@/lib/cheatdb";
import { addCheats, ensureActiveSet, getActiveSet, useWorkspace } from "@/lib/sets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/game/$titleId")({
  head: ({ params }) => ({
    meta: [
      { title: `Cheats for ${params.titleId} — Cheat Forge` },
      {
        name: "description",
        content: `Browse and build cheat sets for Switch title ID ${params.titleId}, ready to install in Eden, yuzu or Atmosphere.`,
      },
      { property: "og:title", content: `Switch cheats — ${params.titleId}` },
      {
        property: "og:description",
        content: "Pick cheats, edit codes and install them into your emulator.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const { titleId } = Route.useParams();
  const ws = useWorkspace();
  const activeSet = getActiveSet(ws);

  const title = useQuery({
    queryKey: ["title", titleId],
    queryFn: () => loadTitle(titleId),
    staleTime: Infinity,
  });

  const builds = useMemo(() => Object.keys(title.data?.builds ?? {}), [title.data]);
  const [buildId, setBuild] = useState<string | null>(null);
  const currentBuild = buildId && builds.includes(buildId) ? buildId : (builds[0] ?? null);
  const cheats: Cheat[] = currentBuild ? (title.data?.builds[currentBuild] ?? []) : [];

  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCodes, setCustomCodes] = useState("");

  const visible = useMemo(() => {
    const q = normalize(filter);
    if (!q) return cheats;
    return cheats.filter((c) => normalize(c.n).includes(q));
  }, [cheats, filter]);

  const toggle = (key: string, set: Set<string>, apply: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    apply(next);
  };

  function addSelected() {
    if (!title.data || !currentBuild || selected.size === 0) return;
    const setId = ensureActiveSet(ws);
    const picked = cheats.filter((c) => selected.has(c.n));
    addCheats(
      setId,
      { titleId: titleId.toUpperCase(), titleName: title.data.name, buildId: currentBuild },
      picked.map((c) => ({ name: c.n, codes: c.c })),
    );
    toast.success(`Added ${picked.length} cheat${picked.length === 1 ? "" : "s"} to your set`);
    setSelected(new Set());
  }

  function addCustom() {
    if (!title.data || !currentBuild) return;
    const parsedBlocks = parseCheatText(customCodes);
    const codes = customCodes
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const entries =
      parsedBlocks.length > 0 && parsedBlocks[0]!.codes.length > 0 && /^[[{]/.test(customCodes.trim())
        ? parsedBlocks
        : [{ name: customName.trim() || "Custom cheat", codes }];
    if (!entries.some((e) => e.codes.length)) {
      toast.error("Add at least one line of cheat code");
      return;
    }
    const setId = ensureActiveSet(ws);
    addCheats(
      setId,
      { titleId: titleId.toUpperCase(), titleName: title.data.name, buildId: currentBuild },
      entries.map((e) => ({ ...e, custom: true })),
    );
    toast.success("Custom cheat added to your set");
    setCustomName("");
    setCustomCodes("");
    setShowCustom(false);
  }

  if (title.isPending) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-10">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </main>
    );
  }

  if (!title.data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">No cheats for this title ID</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-mono">{titleId}</span> is not in the database.
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to search</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" /> back to search
      </Link>

      <header className="panel mt-4 p-6">
        <h1 className="text-2xl font-bold leading-tight">{title.data.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
          <span>{titleId.toUpperCase()}</span>
          <span className="text-primary">{cheats.length} cheats in this build</span>
          {activeSet && <span>set: {activeSet.name}</span>}
        </div>

        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            build id — must match your game version
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {builds.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setBuild(b);
                  setSelected(new Set());
                }}
                className={`rounded-md border px-3 py-1.5 font-mono text-xs transition-colors ${
                  b === currentBuild
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
                <span className="ml-2 opacity-60">{title.data!.builds[b]!.length}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-6 border-y border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter cheats…"
            className="h-10 max-w-xs"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              setSelected(
                selected.size === visible.length ? new Set() : new Set(visible.map((c) => c.n)),
              )
            }
          >
            {selected.size === visible.length && visible.length > 0 ? "Clear all" : "Select all"}
          </Button>
          <Button size="sm" disabled={selected.size === 0} onClick={addSelected}>
            <Plus className="size-4" /> Add {selected.size || ""} to set
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCustom((v) => !v)}>
            Write custom cheat
          </Button>
        </div>
      </div>

      {showCustom && (
        <section className="panel mt-4 space-y-3 p-5">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Cheat name (e.g. Infinite Rupees)"
          />
          <Textarea
            value={customCodes}
            onChange={(e) => setCustomCodes(e.target.value)}
            rows={6}
            placeholder={"04000000 01234567 0000270F\n\nOr paste a whole [Cheat Name] block"}
            className="font-mono text-xs"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addCustom}>
              Add to set
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCustom(false)}>
              Cancel
            </Button>
          </div>
        </section>
      )}

      <ul className="mt-4 space-y-2">
        {visible.map((cheat) => {
          const isOpen = expanded.has(cheat.n);
          const isSel = selected.has(cheat.n);
          return (
            <li
              key={cheat.n}
              className={`panel overflow-hidden transition-colors ${isSel ? "border-primary/50" : ""}`}
            >
              <div className="flex items-start gap-3 p-3">
                <Checkbox
                  checked={isSel}
                  onCheckedChange={() => toggle(cheat.n, selected, setSelected)}
                  className="mt-1"
                  aria-label={`Select ${cheat.n}`}
                />
                <button
                  className="flex flex-1 items-start justify-between gap-3 text-left"
                  onClick={() => toggle(cheat.n, expanded, setExpanded)}
                >
                  <span className="text-sm font-medium leading-snug">{cheat.n}</span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    {cheat.c.length} line{cheat.c.length === 1 ? "" : "s"}
                    <ChevronDown
                      className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </span>
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-border bg-background/40 p-3">
                  <pre className="code-block max-h-64 overflow-auto whitespace-pre-wrap">
                    {cheat.c.join("\n")}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      void navigator.clipboard.writeText(`[${cheat.n}]\n${cheat.c.join("\n")}`);
                      toast.success("Cheat copied");
                    }}
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {visible.length === 0 && (
        <p className="panel mt-4 p-6 text-sm text-muted-foreground">No cheats match that filter.</p>
      )}

      {activeSet && (
        <div className="mt-8 flex items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm">
            <Check className="mr-2 inline size-4 text-primary" />
            Your set “{activeSet.name}” is ready to export.
          </p>
          <Button asChild variant="secondary" size="sm">
            <Link to="/builder">Open builder</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
