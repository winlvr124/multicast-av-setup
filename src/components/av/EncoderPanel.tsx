import { Laptop, Play, Radio, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SIM_NETWORK, formatUptime } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { SIGNAGE } from "./signage";
import { SignageScreen } from "./SignageScreen";
import { useSimulation } from "./SimulationContext";
import { StatusDot } from "./StatusDot";

export function EncoderPanel() {
  const { streaming, content, setContentId, start, stop, bitrate, uptime, packets } = useSimulation();

  const rows: [string, string, boolean?][] = [
    ["Encoder IP", SIM_NETWORK.encoderIp],
    ["Multicast group", SIM_NETWORK.multicastGroup, true],
    ["UDP port", String(SIM_NETWORK.udpPort)],
    ["Codec", SIM_NETWORK.codec],
    ["Video", SIM_NETWORK.resolution],
    ["Bitrate", streaming ? `${bitrate.toFixed(1)} Mbps` : "0.0 Mbps", true],
    ["Uptime", formatUptime(uptime)],
    ["Packets TX", packets.toLocaleString("en-US")],
  ];

  return (
    <div className="flex flex-col gap-3">
      <section className="panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="size-4 text-primary" />
            <span className="panel-label">Video source · Laptop</span>
          </div>
          <span className="font-mono text-[0.6rem] text-hdmi">HDMI → ENC-01</span>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">Choose the digital signage content to send.</p>
        <div className="grid grid-cols-4 gap-1.5">
          {SIGNAGE.map((item) => {
            const active = item.id === content.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setContentId(item.id)}
                aria-pressed={active}
                aria-label={`Show ${item.title}`}
                className={cn(
                  "group flex flex-col gap-1 rounded-md border p-1 text-left transition-all",
                  active ? "border-primary bg-primary/10 glow-primary" : "border-border hover:border-primary/60",
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
                <span className="truncate text-[0.6rem] leading-tight text-muted-foreground group-aria-pressed:text-foreground">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn("panel p-3 transition-shadow", streaming && "glow-success")}>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className={cn("size-4", streaming ? "text-success" : "text-primary")} />
            <span className="panel-label">Encoder · ENC-01</span>
          </div>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider",
              streaming ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
            )}
          >
            <StatusDot tone={streaming ? "live" : "online"} className="size-2" />
            {streaming ? "Streaming" : "Standby"}
          </span>
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

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="stream" onClick={start} disabled={streaming}>
            <Play /> Start Streaming
          </Button>
          <Button variant="stop" onClick={stop} disabled={!streaming}>
            <Square /> Stop Streaming
          </Button>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-panel-inset p-2.5 font-mono text-[0.68rem]">
          {rows.map(([k, v, hl]) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className={cn("tabular-nums", hl && streaming ? "text-success" : hl ? "text-primary" : "text-foreground")}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-wider text-warning/80">
          ⚠ Example settings · simulated values only
        </p>
      </section>
    </div>
  );
}
