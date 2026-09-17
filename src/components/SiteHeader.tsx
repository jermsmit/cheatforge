import { Link } from "@tanstack/react-router";
import { Boxes, Hammer, LifeBuoy, Search } from "lucide-react";
import { countCheats, getActiveSet, useWorkspace } from "@/lib/sets";

const navItems = [
  { to: "/", label: "Browse", icon: Search },
  { to: "/builder", label: "Builder", icon: Hammer },
  { to: "/help", label: "Setup", icon: LifeBuoy },
] as const;

export function SiteHeader() {
  const ws = useWorkspace();
  const active = getActiveSet(ws);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
            <Boxes className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-mono text-sm font-bold tracking-tight">CHEAT FORGE</span>
            <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              switch cheat db
            </span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <Link
            to="/builder"
            className="ml-2 flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 font-mono text-xs text-primary transition-colors hover:bg-primary/20"
          >
            {active ? `${countCheats(active)} queued` : "no set"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
