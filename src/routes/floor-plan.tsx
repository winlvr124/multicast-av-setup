import { createFileRoute } from "@tanstack/react-router";
import { Play, Plug, Square, Unplug } from "lucide-react";
import { FloorPlanMap } from "@/components/av/FloorPlanMap";
import { useSimulation } from "@/components/av/SimulationContext";
import { SourceSelector } from "@/components/av/SourceControls";
import { StatusDot } from "@/components/av/StatusDot";
import { Button } from "@/components/ui/button";
import {
  DECODERS,
  ENCODERS,
  SIM_NETWORK,
  decoderById,
  decoderDisplayState,
  encoderById,
  type EncoderId,
} from "@/lib/av-sim";

export const Route = createFileRoute("/floor-plan")({
  head: () => ({
    meta: [
      { title: "Floor Plan · Raffles City Level 4 AV-over-IP Simulation" },
      {
        name: "description",
        content:
          "Two encoders and a managed switch in Fairmont Ballroom Foyer with decoders in Canning, Padang and Collyer Rooms, showing simulated Ethernet paths.",
      },
      { property: "og:title", content: "Raffles City Level 4 · AV-over-IP Floor Plan" },
      {
        property: "og:description",
        content: "Animated Ethernet multicast paths across the Level 4 convention rooms — conceptual simulation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FloorPlanPage,
});

function FloorPlanPage() {
  const { streaming, start, stop, statuses, subscriptions, disconnect, reconnect } = useSimulation();

  return (
    <div className="grid h-full gap-3 p-3 lg:grid-cols-[1fr_300px]">
      <section className="panel flex min-h-0 flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="panel-label">Raffles City Convention Centre · Level 4 · Proposed layout</span>
          <span className="font-mono text-[0.6rem] text-muted-foreground/70">Conceptual simulation</span>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-panel-inset">
          <FloorPlanMap />
        </div>
      </section>

      <aside className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
        <section className="panel p-3">
          <span className="panel-label">Stream control</span>
          <div className="mt-2 space-y-2">
            {ENCODERS.map((e) => (
              <div key={e.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                <span className="truncate font-mono text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                  {e.code} · {e.source}
                </span>
                <Button variant="stream" size="sm" onClick={() => start(e.id)} disabled={streaming[e.id]}>
                  <Play /> Start
                </Button>
                <Button variant="stop" size="sm" onClick={() => stop(e.id)} disabled={!streaming[e.id]}>
                  <Square /> Stop
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-3">
          <span className="panel-label">Fairmont Ballroom Foyer</span>
          <ul className="mt-2 space-y-1.5 text-xs">
            {ENCODERS.map((e) => (
              <Device
                key={e.id}
                tone={streaming[e.id] ? "live" : "online"}
                name={`${e.laptop} → ${e.code}`}
                detail={`${e.ip} · ${e.multicastGroup}`}
              />
            ))}
            <Device
              tone={streaming.enc1 || streaming.enc2 ? "live" : "online"}
              name="SW-01 Managed switch"
              detail={`IGMP snooping · VLAN ${SIM_NETWORK.vlan}`}
            />
          </ul>
        </section>

        <section className="panel p-3">
          <span className="panel-label">Rooms · Decoders &amp; displays</span>
          <ul className="mt-2 space-y-2">
            {DECODERS.map((d) => {
              const status = statuses[d.id];
              const encoderId = subscriptions[d.id];
              const encoder = encoderById(encoderId);
              const state = decoderDisplayState(streaming, status, encoderId);
              const tone =
                status === "offline" ? "offline" : status === "connecting" ? "warn" : state === "content" ? "live" : "online";
              return (
                <li key={d.id} className="rounded-md bg-panel-inset p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusDot tone={tone} />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-xs font-semibold">{d.room}</p>
                        <p className="font-mono text-[0.6rem] text-muted-foreground">
                          {d.code} · {d.ip}
                        </p>
                      </div>
                    </div>
                    {status === "offline" ? (
                      <Button variant="control" size="sm" onClick={() => reconnect(d.id)} aria-label={`Reconnect ${d.code}`}>
                        <Plug />
                      </Button>
                    ) : (
                      <Button
                        variant="control"
                        size="sm"
                        onClick={() => disconnect(d.id)}
                        disabled={status === "connecting"}
                        aria-label={`Disconnect ${d.code}`}
                      >
                        <Unplug />
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                    <SourceSelector decoder={d.id} />
                    <span className="truncate font-mono text-[0.58rem] text-muted-foreground">
                      {status === "offline" ? "—" : encoder.multicastGroup}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel space-y-1.5 p-3 text-xs">
          <span className="panel-label">Legend</span>
          <LegendLine className="bg-primary" label="Ethernet link up (idle)" />
          <LegendLine className="bg-success" label="Multicast stream active" />
          <LegendLine className="bg-hdmi" label="HDMI (laptop → encoder)" />
          <LegendLine className="bg-destructive" label="Link down (troubleshooting)" />
          <p className="pt-1 font-mono text-[0.58rem] uppercase tracking-wider text-warning/80">
            ⚠ Example settings · not a hardware controller
          </p>
        </section>
      </aside>
    </div>
  );
}

function Device({ tone, name, detail }: { tone: "live" | "online"; name: string; detail: string }) {
  return (
    <li className="flex items-center gap-2">
      <StatusDot tone={tone} />
      <span className="font-medium">{name}</span>
      <span className="ml-auto truncate font-mono text-[0.6rem] text-muted-foreground">{detail}</span>
    </li>
  );
}

function LegendLine({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1 w-6 rounded-full ${className}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
