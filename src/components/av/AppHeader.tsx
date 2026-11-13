import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Map, Network } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";
import { StatusDot } from "./StatusDot";

const tabClass =
  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-4";

export function AppHeader() {
  const { streaming: map } = useSimulation();
  const live = Object.values(map).filter(Boolean).length;
  const streaming = live > 0;
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/70 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/15 text-primary glow-primary">
          <Network className="size-5" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold tracking-tight">AV-over-IP Multicast Signage</h1>
          <p className="text-xs text-muted-foreground">
            ITE AV IT &amp; Streaming · Option B – Streaming Digital Signage (1-to-Many)
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-1 rounded-lg border border-border bg-panel-inset p-1">
        <Link to="/" className={tabClass} activeProps={{ className: "bg-primary/15 text-primary" }} activeOptions={{ exact: true }}>
          <LayoutDashboard /> Dashboard
        </Link>
        <Link to="/floor-plan" className={tabClass} activeProps={{ className: "bg-primary/15 text-primary" }}>
          <Map /> Floor Plan
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[0.65rem] font-semibold uppercase tracking-wider",
            streaming ? "border-success/40 text-success" : "border-border text-muted-foreground",
          )}
        >
          <StatusDot tone={streaming ? "live" : "idle"} className="size-2" />
          {streaming ? `Multicast live · ${live} ${live === 1 ? "stream" : "streams"}` : "Streams stopped"}
        </span>
        <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-warning">
          Simulation · not connected to hardware
        </span>
        <span className="hidden min-w-[4.5rem] font-mono text-sm tabular-nums text-muted-foreground xl:inline">{clock}</span>
      </div>
    </header>
  );
}
