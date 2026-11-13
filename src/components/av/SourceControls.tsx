import { Layers, Split } from "lucide-react";
import { ENCODERS, matchPreset, type DecoderId, type EncoderId } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";

export const sourceText: Record<EncoderId, string> = { enc1: "text-source-a", enc2: "text-source-b" };
export const sourceFill: Record<EncoderId, string> = { enc1: "fill-source-a", enc2: "fill-source-b" };
export const sourceBg: Record<EncoderId, string> = { enc1: "bg-source-a", enc2: "bg-source-b" };

export function SourceBadge({ encoder, className }: { encoder: EncoderId; className?: string }) {
  const e = ENCODERS.find((x) => x.id === encoder)!;
  return (
    <span
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded font-mono text-[0.6rem] font-bold text-primary-foreground",
        sourceBg[encoder],
        className,
      )}
      title={`${e.source} · ${e.code}`}
    >
      {e.letter}
    </span>
  );
}

/** Per-decoder choice of which encoder's multicast group to join. */
export function SourceSelector({ decoder, className }: { decoder: DecoderId; className?: string }) {
  const { subscriptions, subscribe } = useSimulation();
  return (
    <div
      role="radiogroup"
      aria-label="Subscribed encoder"
      className={cn("grid grid-cols-2 gap-1 rounded-md bg-panel-inset p-0.5", className)}
    >
      {ENCODERS.map((e) => {
        const active = subscriptions[decoder] === e.id;
        return (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => subscribe(decoder, e.id)}
            className={cn(
              "flex items-center justify-center gap-1 rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold transition-colors",
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SourceBadge encoder={e.id} className={active ? undefined : "opacity-50"} />
            {e.code}
          </button>
        );
      })}
    </div>
  );
}

/** Quick switch between the 2 + 1 default and all three on one multicast stream. */
export function RoutingPresets({ className }: { className?: string }) {
  const { subscriptions, applyPreset } = useSimulation();
  const current = matchPreset(subscriptions);
  const opts = [
    { id: "split" as const, label: "2 + 1 split", Icon: Split },
    { id: "allEnc1" as const, label: "All on ENC-01", Icon: Layers },
  ];
  return (
    <div className={cn("flex items-center gap-1 rounded-md border border-border bg-panel-inset p-0.5", className)}>
      {opts.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          aria-pressed={current === id}
          onClick={() => applyPreset(id)}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider transition-colors [&_svg]:size-3",
            current === id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon /> {label}
        </button>
      ))}
    </div>
  );
}
