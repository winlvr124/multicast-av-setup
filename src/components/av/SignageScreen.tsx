import { Loader2, MonitorOff, WifiOff } from "lucide-react";
import { encoderById, type DisplayState, type EncoderId } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import type { SignageItem } from "./signage";
import { sourceBg } from "./SourceControls";

export function SignageScreen({
  state,
  content,
  className,
  compact = false,
  source,
}: {
  state: DisplayState;
  content: SignageItem;
  className?: string;
  compact?: boolean;
  /** When set, tags the picture with the encoder it came from. */
  source?: EncoderId | undefined;
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
      {state === "content" && source && (
        <span
          className={cn(
            "absolute bottom-1 left-1 rounded px-1 py-px font-mono text-[0.5rem] font-bold uppercase tracking-wider text-primary-foreground",
            sourceBg[source],
          )}
        >
          {encoderById(source).letter} · {encoderById(source).code}
        </span>
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
