import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Database, Gamepad2, ArrowRight } from "lucide-react";
import { loadIndex, loadMeta, searchTitles } from "@/lib/cheatdb";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Browse Switch cheats — Cheat Forge" },
      {
        name: "description",
        content:
          "Search a database of 35,532 Nintendo Switch cheat codes across 2,114 games by name or title ID.",
      },
      { property: "og:title", content: "Browse Switch cheats — Cheat Forge" },
      {
        property: "og:description",
        content: "Search 2,114 games worth of Switch cheats and build custom sets for Eden.",
      },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const [query, setQuery] = useState("");
  const index = useQuery({ queryKey: ["cheat-index"], queryFn: loadIndex, staleTime: Infinity });
  const meta = useQuery({ queryKey: ["cheat-meta"], queryFn: loadMeta, staleTime: Infinity });

  const results = useMemo(
    () => (index.data ? searchTitles(index.data, query) : []),
    [index.data, query],
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <section className="panel relative overflow-hidden p-8 sm:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
          local cheat workbench
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
          Search, edit and forge Switch cheat sets — then drop them straight into Eden.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          The whole cheat database runs in your browser. Pick the codes you want, tweak them, and
          install to your emulator folder or download a ready-to-unzip package.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by game name or title ID (e.g. odyssey, 0100000000010000)"
              className="h-12 pl-10 font-mono text-sm"
            />
          </div>
          <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="size-4 text-primary" />
              {meta.data ? meta.data.titles.toLocaleString() : "—"} games
            </span>
            <span className="flex items-center gap-1.5">
              <Database className="size-4 text-primary" />
              {meta.data ? meta.data.cheats.toLocaleString() : "—"} cheats
            </span>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {query ? `${results.length} match${results.length === 1 ? "" : "es"}` : "All games (A–Z)"}
        </h2>

        {index.isPending && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        )}

        {index.isError && (
          <p className="panel p-6 text-sm text-destructive">
            The cheat database could not be loaded. Refresh the page to try again.
          </p>
        )}

        {index.data && results.length === 0 && (
          <p className="panel p-6 text-sm text-muted-foreground">
            Nothing matched “{query}”. Try a shorter word, or paste the 16-character title ID.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((t) => (
            <Link
              key={t.i}
              to="/game/$titleId"
              params={{ titleId: t.i }}
              className="panel group flex flex-col gap-2 p-4 transition-colors hover:border-primary/50"
            >
              <span className="line-clamp-2 font-semibold leading-snug">{t.n}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{t.i}</span>
              <span className="mt-auto flex items-center justify-between pt-2 font-mono text-[11px]">
                <span className="text-primary">
                  {t.c} cheats · {t.b.length} build{t.b.length === 1 ? "" : "s"}
                </span>
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </span>
            </Link>
          ))}
        </div>

        {!query && index.data && index.data.length > results.length && (
          <p className="mt-6 text-center font-mono text-xs text-muted-foreground">
            Showing {results.length} of {index.data.length.toLocaleString()} games — start typing to
            find the rest.
          </p>
        )}
      </section>
    </main>
  );
}
