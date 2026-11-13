import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";

export function EventLog({ className }: { className?: string }) {
  const { log } = useSimulation();
  return (
    <section className={cn("panel flex min-h-0 flex-col p-3", className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className="panel-label">Simulated event log</span>
        <span className="font-mono text-[0.58rem] text-muted-foreground/70">virtual devices only</span>
      </div>
      <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto font-mono text-[0.66rem]" aria-live="polite">
        {log.map((e) => (
          <li key={e.id} className="flex gap-2 animate-in fade-in slide-in-from-top-1">
            <span className="shrink-0 text-muted-foreground/60">{e.time}</span>
            <span
              className={cn(
                e.level === "ok" && "text-success",
                e.level === "warn" && "text-warning",
                e.level === "info" && "text-foreground/85",
              )}
            >
              {e.message}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
