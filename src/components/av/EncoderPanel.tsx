import { Laptop, Play, Radio, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIM_NETWORK, canSelectContent, decoderById, encoderById, formatUptime, subscribersOf, type EncoderId } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { SIGNAGE } from "./signage";
import { SignageScreen } from "./SignageScreen";
import { useSimulation } from "./SimulationContext";
import { SourceBadge } from "./SourceControls";
import { StatusDot } from "./StatusDot";

export function EncoderPanel({ encoder }: { encoder: EncoderId }) {
  const { streaming: streamingMap, contentByEncoder, contentIds, setContentId, start, stop, stats, subscriptions } =
    useSimulation();
  const e = encoderById(encoder);
  const streaming = streamingMap[encoder];
  const content = contentByEncoder[encoder];
  const { bitrate, uptime, packets } = stats[encoder];
  const rooms = subscribersOf(subscriptions, encoder).map((id) => decoderById(id).room.replace(" Room", ""));
  const other = encoder === "enc1" ? "ENC-02" : "ENC-01";

  const rows: [string, string, boolean?][] = [
    ["Encoder IP", e.ip],
    ["Group", `${e.multicastGroup}:${SIM_NETWORK.udpPort}`, true],
    ["Bitrate", streaming ? `${bitrate.toFixed(1)} Mbps` : "0.0 Mbps", true],
    ["Uptime", formatUptime(uptime)],
    ["Packets TX", packets.toLocaleString("en-US")],
    ["Switch port", String(e.switchPort)],
  ];

  return (
    <section className={cn("panel p-3 transition-shadow", streaming && "glow-success")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Radio className={cn("size-4 shrink-0", streaming ? "text-success" : "text-primary")} />
          <span className="panel-label truncate">
            Encoder · {e.code}
          </span>
          <SourceBadge encoder={encoder} />
        </div>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider",
            streaming ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
          )}
        >
          <StatusDot tone={streaming ? "live" : "online"} className="size-2" />
          {streaming ? "Streaming" : "Standby"}
        </span>
      </div>

      <div className="mb-2 flex items-center justify-between gap-2 text-[0.62rem]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Laptop className="size-3.5 text-primary" /> {e.laptop} · {e.source}
        </span>
        <span className="font-mono text-hdmi">HDMI → {e.code}</span>
      </div>

      <div className="relative">
        <SignageScreen state="content" content={content} className={streaming ? "" : "opacity-80"} />
        <span className="absolute left-2 top-2 rounded bg-background/80 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-muted-foreground">
          HDMI input preview
        </span>
        {streaming && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-success px-1.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase tracking-wider text-success-foreground">
            ● Live
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5" role="group" aria-label={`${e.source} content`}>
        {SIGNAGE.map((item) => {
          const active = item.id === content.id;
          const allowed = canSelectContent(encoder, item.id, contentIds);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setContentId(encoder, item.id)}
              aria-pressed={active}
              disabled={!allowed}
              aria-label={`Show ${item.title} on ${e.code}`}
              title={allowed ? item.title : `${item.title} is playing on ${other}`}
              className={cn(
                "group relative flex flex-col gap-0.5 rounded-md border p-0.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-35",
                active ? "border-primary bg-primary/10 glow-primary" : "border-border enabled:hover:border-primary/60",
              )}
            >
              <img
                src={item.src}
                alt=""
                width={160}
                height={91}
                loading="lazy"
                className="aspect-video w-full rounded-sm object-cover"
              />
              <span className="truncate text-[0.56rem] leading-tight text-muted-foreground group-aria-pressed:text-foreground">
                {allowed ? item.title : `On ${other}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="stream" size="sm" onClick={() => start(encoder)} disabled={streaming}>
          <Play /> Start Streaming
        </Button>
        <Button variant="stop" size="sm" onClick={() => stop(encoder)} disabled={!streaming}>
          <Square /> Stop Streaming
        </Button>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-md bg-panel-inset p-2 font-mono text-[0.64rem]">
        {rows.map(([k, v, hl]) => (
          <div key={k} className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className={cn("truncate tabular-nums", hl && streaming ? "text-success" : hl ? "text-primary" : "text-foreground")}>
              {v}
            </dd>
          </div>
        ))}
        <div className="col-span-2 flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">Subscribers</dt>
          <dd className="truncate text-foreground">{rooms.length ? rooms.join(" · ") : "none (pruned at switch)"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function EncoderColumn() {
  return (
    <div className="flex flex-col gap-3">
      <EncoderPanel encoder="enc1" />
      <EncoderPanel encoder="enc2" />
      <p className="px-1 font-mono text-[0.58rem] uppercase tracking-wider text-warning/80">
        ⚠ Example settings · {SIM_NETWORK.codec} {SIM_NETWORK.resolution} · simulated values only
      </p>
    </div>
  );
}
