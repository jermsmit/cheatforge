export type Cheat = { n: string; c: string[]; m?: boolean };
export type TitleEntry = { i: string; n: string; b: string[]; c: number; s: string };
export type TitleDetail = { name: string; builds: Record<string, Cheat[]> };
export type DbMeta = { titles: number; cheats: number; generated: string };

const shardCache = new Map<string, Promise<Record<string, TitleDetail>>>();

export async function loadIndex(): Promise<TitleEntry[]> {
  const res = await fetch("/cheatdb/index.json");
  if (!res.ok) throw new Error("Could not load the cheat index");
  return res.json();
}

export async function loadMeta(): Promise<DbMeta> {
  const res = await fetch("/cheatdb/meta.json");
  if (!res.ok) throw new Error("Could not load database info");
  return res.json();
}

export function loadShard(shard: string): Promise<Record<string, TitleDetail>> {
  let p = shardCache.get(shard);
  if (!p) {
    p = fetch(`/cheatdb/shards/${shard}.json`).then((r) => {
      if (!r.ok) throw new Error("Could not load cheats for this game");
      return r.json();
    });
    shardCache.set(shard, p);
  }
  return p;
}

export function shardFor(titleId: string) {
  return (titleId[4] || "_").toUpperCase();
}

export async function loadTitle(titleId: string): Promise<TitleDetail | null> {
  const id = titleId.toUpperCase();
  const shard = await loadShard(shardFor(id));
  return shard[id] ?? null;
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function searchTitles(index: TitleEntry[], query: string, limit = 60) {
  const q = normalize(query);
  if (!q) return index.slice(0, limit);
  const terms = q.split(" ");
  const raw = query.trim().toUpperCase();
  const scored: { t: TitleEntry; score: number }[] = [];
  for (const t of index) {
    if (raw.length >= 4 && t.i.includes(raw)) {
      scored.push({ t, score: 1000 });
      continue;
    }
    const name = normalize(t.n);
    if (!terms.every((term) => name.includes(term))) continue;
    let score = 100 - Math.min(90, name.indexOf(terms[0]!));
    if (name.startsWith(q)) score += 200;
    scored.push({ t, score });
  }
  scored.sort((a, b) => b.score - a.score || a.t.n.localeCompare(b.t.n));
  return scored.slice(0, limit).map((s) => s.t);
}

export function cheatToText(cheat: { name: string; codes: string[] }) {
  return `[${cheat.name}]\n${cheat.codes.join("\n")}`;
}

export function buildFileText(cheats: { name: string; codes: string[] }[]) {
  return cheats.map(cheatToText).join("\n\n") + "\n";
}

/** Parse pasted Atmosphere-format cheat text into cheat entries. */
export function parseCheatText(text: string) {
  const out: { name: string; codes: string[] }[] = [];
  let cur: { name: string; codes: string[] } | null = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[[{](.*)[\]}]$/);
    if (m) {
      if (cur) out.push(cur);
      cur = { name: m[1]!.trim() || "Unnamed", codes: [] };
    } else if (cur) {
      cur.codes.push(line);
    }
  }
  if (cur) out.push(cur);
  return out;
}
