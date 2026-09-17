import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderTree, MonitorDown, Terminal } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Where cheats go — Eden, yuzu & Atmosphere setup" },
      {
        name: "description",
        content:
          "Exact cheat folder locations for Eden on Fedora KDE, Ubuntu and Windows, plus Atmosphere SD card layout.",
      },
      { property: "og:title", content: "Where cheats go — Eden setup guide" },
      {
        property: "og:description",
        content: "Cheat folder paths for Eden on Linux and Windows, and Atmosphere on hardware.",
      },
    ],
  }),
  component: HelpPage,
});

const paths = [
  {
    icon: Terminal,
    title: "Eden on Fedora KDE / Ubuntu",
    rows: [
      ["Native / AppImage", "~/.local/share/eden/load/"],
      ["Flatpak", "~/.var/app/dev.eden_emu.eden/data/eden/load/"],
      ["Config check", "Eden → Emulation → Configure → Filesystem shows the data folder"],
    ],
  },
  {
    icon: MonitorDown,
    title: "Eden / yuzu on Windows",
    rows: [
      ["Installed", "%APPDATA%\\eden\\load\\"],
      ["Portable", "user\\load\\ next to eden.exe"],
    ],
  },
  {
    icon: FolderTree,
    title: "Atmosphere on real hardware",
    rows: [
      ["SD card", "/atmosphere/contents/<TitleID>/cheats/<BuildID>.txt"],
      ["Toggle in game", "Hold the cheat toggle in the Atmosphere overlay (Tesla / EdiZon)"],
    ],
  },
];

function HelpPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Getting cheats into your emulator</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Build a set in the{" "}
        <Link to="/builder" className="text-primary underline underline-offset-4">
          Builder
        </Link>
        , then either write it directly into the folder below, or download the ZIP and unzip it
        there so the <span className="font-mono text-foreground">load</span> folder merges.
      </p>

      <div className="mt-8 space-y-4">
        {paths.map(({ icon: Icon, title, rows }) => (
          <section key={title} className="panel p-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <Icon className="size-4 text-primary" />
              {title}
            </h2>
            <dl className="mt-4 space-y-2">
              {rows.map(([label, value]) => (
                <div key={label} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {label}
                  </dt>
                  <dd className="code-block break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section className="panel mt-4 p-6">
        <h2 className="font-semibold">Turning a cheat on in Eden</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Right-click the game in the Eden list and choose Properties → Add-Ons.</li>
          <li>Tick the cheat set you installed (it appears under the name you gave the set).</li>
          <li>
            The build ID must match your game version. Update the game and the build ID changes —
            pick the matching build in the game page, or the cheats silently do nothing.
          </li>
          <li>Cheat codes with a different build ID than your dump will never activate.</li>
        </ol>
      </section>

      <section className="panel mt-4 p-6">
        <h2 className="font-semibold">Direct folder writing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The “Write to folder” button uses a browser feature available in Chrome, Chromium, Brave
          and Edge (including on Fedora KDE). Firefox does not support it — use the ZIP download
          there. You pick the folder once per session; nothing is uploaded anywhere.
        </p>
      </section>
    </main>
  );
}
