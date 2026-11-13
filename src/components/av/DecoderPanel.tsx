import { Plug, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decoderDisplayState, encoderById, type DecoderInfo } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { SignageScreen } from "./SignageScreen";
import { useSimulation } from "./SimulationContext";
import { SourceSelector } from "./SourceControls";
import { StatusDot, type Tone } from "./StatusDot";

export function DecoderPanel({ decoder }: { decoder: DecoderInfo }) {
  const { streaming, contentByEncoder, statuses, stats, subscriptions, disconnect, reconnect } = useSimulation();
  const status = statuses[decoder.id];
  const encoderId = subscriptions[decoder.id];
  const encoder = encoderById(encoderId);
  const state = decoderDisplayState(streaming, status, encoderId);
  const live = state === "content";

  const tone: Tone = status === "offline" ? "offline" : status === "connecting" ? "warn" : live ? "live" : "online";
  const label = status === "offline" ? "Offline" : status === "connecting" ? "Joining" : live ? "Receiving" : "Online";

  return (
    <section className={cn("panel flex min-h-0 flex-1 flex-col p-2.5 transition-shadow", live && "glow-success")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot tone={tone} />
          <h3 className="truncate text-sm font-semibold">{decoder.room}</h3>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 font-mono text-[0.58rem] font-semibold uppercase tracking-wider",
            tone === "live" && "bg-success/15 text-success",
            tone === "online" && "bg-primary/15 text-primary",
            tone === "warn" && "bg-warning/15 text-warning",
            tone === "offline" && "bg-destructive/15 text-destructive",
          )}
        >
          {label}
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-2.5">
        <div className="flex flex-col justify-center">
          <SignageScreen state={state} content={contentByEncoder[encoderId]} source={encoderId} compact />
          <span className="mt-1 text-center font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground/70">
            Display · HDMI from {decoder.code}
          </span>
        </div>
        <div className="flex min-w-0 flex-col justify-between gap-1.5">
          <SourceSelector decoder={decoder.id} />
          <dl className="space-y-0.5 font-mono text-[0.62rem]">
            <Row k="Decoder" v={decoder.code} />
            <Row k="IP" v={decoder.ip} />
            <Row k="Group" v={status === "offline" ? "—" : encoder.multicastGroup} />
            <Row
              k="RX"
              v={live ? `${(stats[encoderId].bitrate - 0.05).toFixed(1)} Mbps` : "0.0 Mbps"}
              className={live ? "text-success" : undefined}
            />
          </dl>
          {status === "offline" ? (
            <Button variant="control" size="sm" onClick={() => reconnect(decoder.id)}>
              <Plug /> Reconnect
            </Button>
          ) : (
            <Button
              variant="control"
              size="sm"
              onClick={() => disconnect(decoder.id)}
              disabled={status === "connecting"}
            >
              <Unplug /> Disconnect
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function Row({ k, v, className }: { k: string; v: string; className?: string | undefined }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className={cn("truncate tabular-nums text-foreground", className)}>{v}</dd>
    </div>
  );
}
