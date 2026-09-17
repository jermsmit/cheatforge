import { useSyncExternalStore } from "react";

export type SetCheat = { id: string; name: string; codes: string[]; custom?: boolean };
export type SetGame = {
  titleId: string;
  titleName: string;
  buildId: string;
  cheats: SetCheat[];
};
export type CheatSet = {
  id: string;
  name: string;
  client: string;
  notes: string;
  games: SetGame[];
  updatedAt: number;
};
export type Workspace = { sets: CheatSet[]; activeId: string | null };

const KEY = "cheat-forge-workspace-v1";

let state: Workspace = { sets: [], activeId: null };
let loaded = false;
const listeners = new Set<() => void>();

function read(): Workspace {
  if (typeof window === "undefined") return { sets: [], activeId: null };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { sets: [], activeId: null };
    const parsed = JSON.parse(raw) as Workspace;
    if (!Array.isArray(parsed.sets)) return { sets: [], activeId: null };
    return parsed;
  } catch {
    return { sets: [], activeId: null };
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = read();
    loaded = true;
  }
}

function commit(next: Workspace) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked */
    }
  }
  listeners.forEach((l) => l());
}

const EMPTY: Workspace = { sets: [], activeId: null };

export function useWorkspace(): Workspace {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      ensureLoaded();
      return state;
    },
    () => EMPTY,
  );
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function createSet(name = "New cheat set", client = ""): CheatSet {
  ensureLoaded();
  const set: CheatSet = { id: uid(), name, client, notes: "", games: [], updatedAt: Date.now() };
  commit({ sets: [set, ...state.sets], activeId: set.id });
  return set;
}

export function deleteSet(id: string) {
  ensureLoaded();
  const sets = state.sets.filter((s) => s.id !== id);
  commit({ sets, activeId: state.activeId === id ? (sets[0]?.id ?? null) : state.activeId });
}

export function duplicateSet(id: string) {
  ensureLoaded();
  const src = state.sets.find((s) => s.id === id);
  if (!src) return;
  const copy: CheatSet = {
    ...structuredClone(src),
    id: uid(),
    name: `${src.name} (copy)`,
    updatedAt: Date.now(),
  };
  commit({ sets: [copy, ...state.sets], activeId: copy.id });
}

export function setActive(id: string) {
  ensureLoaded();
  commit({ ...state, activeId: id });
}

export function updateSet(id: string, patch: (s: CheatSet) => CheatSet) {
  ensureLoaded();
  commit({
    ...state,
    sets: state.sets.map((s) => (s.id === id ? { ...patch(s), updatedAt: Date.now() } : s)),
  });
}

export function getActiveSet(ws: Workspace): CheatSet | null {
  return ws.sets.find((s) => s.id === ws.activeId) ?? ws.sets[0] ?? null;
}

/** Ensures a set exists and returns its id. */
export function ensureActiveSet(ws: Workspace): string {
  const active = getActiveSet(ws);
  if (active) return active.id;
  return createSet("Default set").id;
}

export function addCheats(
  setId: string,
  game: { titleId: string; titleName: string; buildId: string },
  cheats: { name: string; codes: string[]; custom?: boolean }[],
) {
  updateSet(setId, (s) => {
    const games = [...s.games];
    const idx = games.findIndex(
      (g) => g.titleId === game.titleId && g.buildId === game.buildId,
    );
    const incoming = cheats.map((c) => ({ id: uid(), ...c }));
    if (idx === -1) {
      games.push({ ...game, cheats: incoming });
    } else {
      const existing = games[idx]!;
      const names = new Set(existing.cheats.map((c) => c.name));
      games[idx] = {
        ...existing,
        cheats: [...existing.cheats, ...incoming.filter((c) => !names.has(c.name))],
      };
    }
    return { ...s, games };
  });
}

export function removeCheat(setId: string, titleId: string, buildId: string, cheatId: string) {
  updateSet(setId, (s) => ({
    ...s,
    games: s.games
      .map((g) =>
        g.titleId === titleId && g.buildId === buildId
          ? { ...g, cheats: g.cheats.filter((c) => c.id !== cheatId) }
          : g,
      )
      .filter((g) => g.cheats.length > 0),
  }));
}

export function updateCheat(
  setId: string,
  titleId: string,
  buildId: string,
  cheatId: string,
  patch: { name?: string; codes?: string[] },
) {
  updateSet(setId, (s) => ({
    ...s,
    games: s.games.map((g) =>
      g.titleId === titleId && g.buildId === buildId
        ? {
            ...g,
            cheats: g.cheats.map((c) => (c.id === cheatId ? { ...c, ...patch } : c)),
          }
        : g,
    ),
  }));
}

export function removeGame(setId: string, titleId: string, buildId: string) {
  updateSet(setId, (s) => ({
    ...s,
    games: s.games.filter((g) => !(g.titleId === titleId && g.buildId === buildId)),
  }));
}

export function countCheats(set: CheatSet) {
  return set.games.reduce((n, g) => n + g.cheats.length, 0);
}
