import JSZip from "jszip";
import { buildFileText } from "./cheatdb";
import type { CheatSet } from "./sets";

export type Target = "eden" | "atmosphere";

export const TARGETS: Record<Target, { label: string; root: string; hint: string }> = {
  eden: {
    label: "Eden / yuzu style",
    root: "load",
    hint: "Files go to load/<TitleID>/<ModName>/cheats/<BuildID>.txt",
  },
  atmosphere: {
    label: "Atmosphere (real Switch)",
    root: "atmosphere/contents",
    hint: "Files go to atmosphere/contents/<TitleID>/cheats/<BuildID>.txt",
  },
};

function safeFolder(name: string) {
  return (name.replace(/[^\w .-]+/g, "_").trim() || "CheatForge").slice(0, 48);
}

/** Relative file paths (from the chosen root folder) mapped to file contents. */
export function buildFiles(set: CheatSet, target: Target): Record<string, string> {
  const files: Record<string, string> = {};
  const mod = safeFolder(set.name);
  for (const game of set.games) {
    if (!game.cheats.length) continue;
    const rel =
      target === "eden"
        ? `${game.titleId}/${mod}/cheats/${game.buildId}.txt`
        : `${game.titleId}/cheats/${game.buildId}.txt`;
    const body = buildFileText(game.cheats.map((c) => ({ name: c.name, codes: c.codes })));
    files[rel] = files[rel] ? `${files[rel]}\n${body}` : body;
  }
  return files;
}

export function canWriteToFolder() {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Writes the set straight into a folder the user picks (Chrome/Chromium/Edge). */
export async function installToFolder(set: CheatSet, target: Target) {
  const picker = (window as unknown as {
    showDirectoryPicker: (o?: { mode?: string; id?: string }) => Promise<FileSystemDirectoryHandle>;
  }).showDirectoryPicker;
  const root = await picker({ mode: "readwrite", id: "cheat-forge-root" });
  const files = buildFiles(set, target);
  let written = 0;
  for (const [rel, content] of Object.entries(files)) {
    const parts = rel.split("/");
    const fileName = parts.pop()!;
    let dir = root;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true });
    }
    const handle = await dir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    written++;
  }
  return { written, folder: root.name };
}

export async function downloadZip(set: CheatSet, target: Target) {
  const zip = new JSZip();
  const root = TARGETS[target].root;
  const files = buildFiles(set, target);
  for (const [rel, content] of Object.entries(files)) {
    zip.file(`${root}/${rel}`, content);
  }
  zip.file(
    "README.txt",
    [
      `Cheat set: ${set.name}`,
      set.client ? `Client: ${set.client}` : "",
      "",
      TARGETS[target].hint,
      "",
      target === "eden"
        ? "Linux (Eden): unzip so the 'load' folder merges into ~/.local/share/eden/\nFlatpak: ~/.var/app/dev.eden_emu.eden/data/eden/\nWindows: %APPDATA%\\eden\\  (or the 'user' folder next to eden.exe in portable mode)"
        : "Copy the 'atmosphere' folder to the root of your SD card and merge.",
      "",
      "In Eden: right-click the game > Properties > Add-Ons and tick the cheat set.",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFolder(set.name)}-${target}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return Object.keys(files).length;
}
