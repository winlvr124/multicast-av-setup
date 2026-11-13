import {
  DECODERS,
  ENCODERS,
  SIM_NETWORK,
  decoderDisplayState,
  subscribersOf,
  type DecoderId,
  type DecoderStatus,
  type EncoderId,
} from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";
import { sourceFill } from "./SourceControls";

const W = 640;
const H = 520;
const SW = { x: 245, y: 228, w: 150, h: 64 };
const ENC_X = 30;
const ENC_W = 90;
const ENC_H = 60;
const ENC_Y: Record<EncoderId, number> = { enc1: 140, enc2: 360 };
const SW_IN_Y: Record<EncoderId, number> = { enc1: 250, enc2: 270 };
const DEC_Y: Record<DecoderId, number> = { dec1: 80, dec2: 260, dec3: 440 };
const DEC_X = 516;

const uplink = (id: EncoderId) => {
  const y = ENC_Y[id];
  const yi = SW_IN_Y[id];
  return `M${ENC_X + ENC_W} ${y} C ${ENC_X + ENC_W + 70} ${y}, ${SW.x - 70} ${yi}, ${SW.x} ${yi}`;
};
const downlink = (y: number) =>
  y === 260
    ? `M${SW.x + SW.w} 260 H${DEC_X}`
    : `M${SW.x + SW.w} 260 C 470 260, 450 ${y}, ${DEC_X} ${y}`;

function Packets({
  pathId,
  fill,
  count = 4,
  dur = 1.6,
}: {
  pathId: string;
  fill: string;
  count?: number;
  dur?: number;
}) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <g key={i} className={fill}>
          <circle r={7} opacity={0.25}>
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${-(i * dur) / count}s`}>
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={3.2}>
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${-(i * dur) / count}s`}>
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </g>
      ))}
    </g>
  );
}

function linkClass(live: boolean, status: DecoderStatus) {
  if (status === "offline") return "stroke-destructive/70";
  if (status === "connecting") return "stroke-warning";
  return live ? "stroke-success/70" : "stroke-primary/70";
}

export function NetworkMap() {
  const { streaming, anyStreaming, statuses, subscriptions } = useSimulation();
  const liveDec = (id: DecoderId) => decoderDisplayState(streaming, statuses[id], subscriptions[id]) === "content";

  const groupCounts = ENCODERS.map((e) => ({ e, n: subscribersOf(subscriptions, e.id).length }));
  const oneSource = groupCounts.some((g) => g.n === DECODERS.length);
  const caption = oneSource
    ? `ONE SOURCE → MULTICAST → THREE IDENTICAL OUTPUTS (SIMULATED)`
    : `${groupCounts.map(({ e, n }) => `${e.code} → ${n} ${n === 1 ? "ROOM" : "ROOMS"}`).join(" · ")} · SIMULATED`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label="Simulated multicast network diagram">
      <defs>
        {ENCODERS.map((e) => (
          <path key={e.id} id={`up-${e.id}`} d={uplink(e.id)} />
        ))}
        {DECODERS.map((d) => (
          <path key={d.id} id={`down-${d.id}`} d={downlink(DEC_Y[d.id])} />
        ))}
        <linearGradient id="sw-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--secondary)" />
          <stop offset="100%" stopColor="var(--card)" />
        </linearGradient>
      </defs>

      {/* Uplinks: each encoder → switch (one multicast group per encoder) */}
      {ENCODERS.map((e) => {
        const on = streaming[e.id];
        const midY = (ENC_Y[e.id] + SW_IN_Y[e.id]) / 2;
        return (
          <g key={e.id}>
            <use href={`#up-${e.id}`} className={cn("fill-none stroke-[3]", on ? "stroke-success/70" : "stroke-primary/60")} />
            {on && (
              <use href={`#up-${e.id}`} className="fill-none stroke-success stroke-[1.5] animate-dash-flow" strokeDasharray="8 4" />
            )}
            <text x={190} y={midY + (e.id === "enc1" ? -6 : 14)} textAnchor="middle" className="fill-muted-foreground/70 font-mono text-[8px]">
              port {e.switchPort}
            </text>
          </g>
        );
      })}

      {/* Downlinks: switch → decoders (replicated per group by IGMP snooping) */}
      {DECODERS.map((d) => {
        const status = statuses[d.id];
        const active = liveDec(d.id);
        return (
          <g key={d.id}>
            <use
              href={`#down-${d.id}`}
              className={cn("fill-none stroke-[3] transition-colors", linkClass(active, status))}
              strokeDasharray={status === "offline" ? "6 6" : undefined}
            />
            {active && (
              <use href={`#down-${d.id}`} className="fill-none stroke-success stroke-[1.5] animate-dash-flow" strokeDasharray="8 4" />
            )}
            {status === "offline" && (
              <g transform={`translate(461 ${(DEC_Y[d.id] + 260) / 2})`}>
                <circle r={10} className="fill-background stroke-destructive" strokeWidth={2} />
                <path d="M-4 -4 L4 4 M4 -4 L-4 4" className="stroke-destructive" strokeWidth={2} />
              </g>
            )}
          </g>
        );
      })}

      {ENCODERS.map((e) =>
        streaming[e.id] ? <Packets key={e.id} pathId={`up-${e.id}`} fill={sourceFill[e.id]} count={3} dur={1.3} /> : null,
      )}
      {DECODERS.map((d) =>
        liveDec(d.id) ? (
          <Packets key={d.id} pathId={`down-${d.id}`} fill={sourceFill[subscriptions[d.id]]} count={4} dur={1.8} />
        ) : null,
      )}

      {/* Encoder nodes */}
      {ENCODERS.map((e) => {
        const on = streaming[e.id];
        const y = ENC_Y[e.id] - ENC_H / 2;
        return (
          <g key={e.id}>
            <rect
              x={ENC_X}
              y={y}
              width={ENC_W}
              height={ENC_H}
              rx={10}
              className={cn("fill-card stroke-2", on ? "stroke-success" : "stroke-primary")}
            />
            <rect x={ENC_X + 14} y={y + 18} width={ENC_W - 28} height={14} rx={3} className="fill-secondary" />
            <circle cx={ENC_X + ENC_W - 22} cy={y + 25} r={2.5} className={cn(on ? "fill-success animate-led-blink" : "fill-primary")} />
            <rect x={ENC_X + 6} y={y - 8} width={18} height={16} rx={4} className={sourceFill[e.id]} />
            <text x={ENC_X + 15} y={y + 4} textAnchor="middle" className="fill-primary-foreground font-mono text-[10px] font-bold">
              {e.letter}
            </text>
            <text x={ENC_X + ENC_W / 2} y={y + 48} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-semibold">
              {e.code}
            </text>
            <text x={ENC_X + ENC_W / 2} y={y + ENC_H + 13} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">
              {e.ip}
            </text>
            <text
              x={ENC_X + ENC_W / 2}
              y={y + ENC_H + 25}
              textAnchor="middle"
              className={cn("font-mono text-[8.5px]", on ? "fill-success" : "fill-primary")}
            >
              {e.multicastGroup}:{SIM_NETWORK.udpPort}
            </text>
          </g>
        );
      })}

      {/* Switch node */}
      <g>
        {anyStreaming && (
          <rect
            x={SW.x - 6}
            y={SW.y - 6}
            width={SW.w + 12}
            height={SW.h + 12}
            rx={14}
            className="fill-none stroke-success/30 animate-pulse"
            strokeWidth={2}
          />
        )}
        <rect x={SW.x} y={SW.y} width={SW.w} height={SW.h} rx={10} fill="url(#sw-body)" className="stroke-primary stroke-2" />
        <text x={SW.x + SW.w / 2} y={SW.y + 20} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-semibold">
          SW-01 · MANAGED SWITCH
        </text>
        {Array.from({ length: 8 }).map((_, i) => {
          const port = i + 1;
          const dec = DECODERS.find((d) => d.switchPort === port);
          const enc = ENCODERS.find((e) => e.switchPort === port);
          const up = !!enc || (dec ? statuses[dec.id] !== "offline" : false);
          const live = enc ? streaming[enc.id] : dec ? liveDec(dec.id) : false;
          return (
            <g key={port}>
              <rect x={SW.x + 15 + i * 15.5} y={SW.y + 32} width={12} height={10} rx={1.5} className="fill-panel-inset stroke-border" />
              <rect
                x={SW.x + 17 + i * 15.5}
                y={SW.y + 34}
                width={8}
                height={2.5}
                className={cn(live ? "fill-success animate-led-blink" : up ? "fill-primary" : "fill-muted-foreground/30")}
                style={live ? { animationDelay: `${i * 0.13}s` } : undefined}
              />
              <text x={SW.x + 21 + i * 15.5} y={SW.y + 54} textAnchor="middle" className="fill-muted-foreground font-mono text-[7px]">
                {port}
              </text>
            </g>
          );
        })}
        <text x={SW.x + SW.w / 2} y={SW.y + SW.h + 16} textAnchor="middle" className="fill-primary font-mono text-[8px]">
          {SIM_NETWORK.igmp} · VLAN {SIM_NETWORK.vlan}
        </text>
        <text x={SW.x + SW.w / 2} y={SW.y + SW.h + 28} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">
          {SIM_NETWORK.switchIp}
        </text>
      </g>

      {/* Decoder nodes */}
      {DECODERS.map((d) => {
        const status = statuses[d.id];
        const y = DEC_Y[d.id];
        const live = liveDec(d.id);
        const enc = ENCODERS.find((e) => e.id === subscriptions[d.id])!;
        return (
          <g key={d.id}>
            <rect
              x={DEC_X}
              y={y - 26}
              width={116}
              height={52}
              rx={10}
              className={cn(
                "fill-card stroke-2 transition-colors",
                status === "offline" ? "stroke-destructive" : status === "connecting" ? "stroke-warning" : live ? "stroke-success" : "stroke-primary",
              )}
            />
            <circle
              cx={DEC_X + 14}
              cy={y - 10}
              r={3}
              className={cn(
                status === "offline" ? "fill-destructive" : status === "connecting" ? "fill-warning animate-led-blink" : live ? "fill-success animate-led-blink" : "fill-primary",
              )}
            />
            <text x={DEC_X + 24} y={y - 7} className="fill-foreground font-mono text-[10px] font-semibold">
              {d.code}
            </text>
            <rect x={DEC_X + 88} y={y - 19} width={20} height={14} rx={3} className={cn(sourceFill[enc.id], !live && "opacity-50")} />
            <text x={DEC_X + 98} y={y - 9} textAnchor="middle" className="fill-primary-foreground font-mono text-[9px] font-bold">
              {enc.letter}
            </text>
            <text x={DEC_X + 12} y={y + 8} className="fill-muted-foreground text-[9px]">
              {d.room}
            </text>
            <text x={DEC_X + 12} y={y + 19} className="fill-muted-foreground/70 font-mono text-[7.5px]">
              port {d.switchPort} · {enc.multicastGroup}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(${W / 2 - 110} ${H - 30})`} className="font-mono text-[8.5px]">
        {ENCODERS.map((e, i) => (
          <g key={e.id} transform={`translate(${i * 120} 0)`}>
            <circle cx={4} cy={-3} r={3.5} className={sourceFill[e.id]} />
            <text x={12} y={0} className="fill-muted-foreground">
              {e.source} · {e.code}
            </text>
          </g>
        ))}
      </g>
      <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-muted-foreground/70 font-mono text-[9px] tracking-widest">
        {caption}
      </text>
    </svg>
  );
}
