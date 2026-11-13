import { Loader2, MonitorOff, WifiOff } from "lucide-react";
import type { DisplayState } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import type { SignageItem } from "./signage";

export function SignageScreen({
  state,
  content,
  className,
  compact = false,
}: {
  state: DisplayState;
  content: SignageItem;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-md border-[3px] border-secondary bg-screen",
        state === "content" && "glow-success",
        className,
      )}
    >
      {state === "content" && (
        <img
          key={content.id}
          src={content.src}
          alt={`Digital signage: ${content.title}`}
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover animate-screen-in"
        />
      )}
      {state === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/70">
          <MonitorOff className={compact ? "size-4" : "size-6"} />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em]">No stream</span>
        </div>
      )}
      {state === "connecting" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-primary">
          <Loader2 className={cn("animate-spin", compact ? "size-4" : "size-6")} />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em]">Acquiring stream…</span>
        </div>
      )}
      {state === "no-signal" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/10 text-destructive">
          <WifiOff className={compact ? "size-4" : "size-6"} />
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em]">No signal</span>
        </div>
      )}
    </div>
  );
}
