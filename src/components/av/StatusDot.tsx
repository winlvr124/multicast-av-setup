import { cn } from "@/lib/utils";

type Tone = "live" | "online" | "warn" | "offline" | "idle";

const toneClass: Record<Tone, string> = {
  live: "bg-success",
  online: "bg-primary",
  warn: "bg-warning",
  offline: "bg-destructive",
  idle: "bg-muted-foreground/50",
};

export function StatusDot({ tone, className }: { tone: Tone; className?: string }) {
  const pulsing = tone === "live" || tone === "warn";
  return (
    <span className={cn("relative inline-flex size-2.5 shrink-0", className)}>
      {pulsing && (
        <span className={cn("absolute inset-0 rounded-full animate-pulse-ring", toneClass[tone])} />
      )}
      <span className={cn("relative inline-flex size-2.5 rounded-full", toneClass[tone])} />
    </span>
  );
}

export type { Tone };
