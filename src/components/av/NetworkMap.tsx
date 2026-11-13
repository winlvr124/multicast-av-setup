import { DECODERS, SIM_NETWORK, type DecoderId, type DecoderStatus } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";

const W = 640;
const H = 520;
const SW = { x: 245, y: 228, w: 150, h: 64 };
const ENC = { x: 30, y: 230, w: 90, h: 60 };
const DEC_Y: Record<DecoderId, number> = { dec1: 80, dec2: 260, dec3: 440 };
const DEC_X = 516;

const UPLINK = `M${ENC.x + ENC.w} 260 H${SW.x}`;
const downlink = (y: number) =>
  y === 260
    ? `M${SW.x + SW.w} 260 H${DEC_X}`
    : `M${SW.x + SW.w} 260 C 470 260, 450 ${y}, ${DEC_X} ${y}`;

function Packets({ pathId, count = 4, dur = 1.6 }: { pathId: string; count?: number; dur?: number }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => (
        <g key={i}>
          <circle r={7} className="fill-success/25">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${-(i * dur) / count}s`}>
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          <circle r={3.2} className="fill-success">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${-(i * dur) / count}s`}>
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
        </g>
      ))}
    </g>
  );
}

function linkClass(streaming: boolean, status: DecoderStatus) {
  if (status === "offline") return "stroke-destructive/70";
  if (status === "connecting") return "stroke-warning";
  return streaming ? "stroke-success/70" : "stroke-primary/70";
}

export function NetworkMap() {
  const { streaming, statuses } = useSimulation();

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="size-full" role="img" aria-label="Simulated multicast network diagram">
      <defs>
        <path id="uplink" d={UPLINK} />
        {DECODERS.map((d) => (
          <path key={d.id} id={`down-${d.id}`} d={downlink(DEC_Y[d.id])} />
        ))}
        <linearGradient id="sw-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--secondary)" />
          <stop offset="100%" stopColor="var(--card)" />
        </linearGradient>
      </defs>

      {/* Uplink: encoder → switch (single multicast stream) */}
      <use href="#uplink" className={cn("fill-none stroke-[3]", streaming ? "stroke-success/70" : "stroke-primary/60")} />
      {streaming && (
        <use href="#uplink" className="fill-none stroke-success stroke-[1.5] animate-dash-flow" strokeDasharray="8 4" />
      )}
      <text x={(ENC.x + ENC.w + SW.x) / 2} y={246} textAnchor="middle" className="fill-muted-foreground font-mono text-[9px]">
        {SIM_NETWORK.multicastGroup}:{SIM_NETWORK.udpPort}
      </text>
      <text x={(ENC.x + ENC.w + SW.x) / 2} y={282} textAnchor="middle" className="fill-muted-foreground/70 font-mono text-[8px]">
        1 stream · port 1
      </text>

      {/* Downlinks: switch → decoders (replicated by IGMP snooping) */}
      {DECODERS.map((d) => {
        const status = statuses[d.id];
        const active = streaming && status === "online";
        return (
          <g key={d.id}>
            <use
              href={`#down-${d.id}`}
              className={cn("fill-none stroke-[3] transition-colors", linkClass(streaming, status))}
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

      {streaming && <Packets pathId="uplink" count={3} dur={1.2} />}
      {DECODERS.map((d) =>
        streaming && statuses[d.id] === "online" ? <Packets key={d.id} pathId={`down-${d.id}`} count={4} dur={1.8} /> : null,
      )}

      {/* Encoder node */}
      <g>
        <rect
          x={ENC.x}
          y={ENC.y}
          width={ENC.w}
          height={ENC.h}
          rx={10}
          className={cn("fill-card stroke-2", streaming ? "stroke-success" : "stroke-primary")}
        />
        <rect x={ENC.x + 14} y={ENC.y + 18} width={ENC.w - 28} height={14} rx={3} className="fill-secondary" />
        <circle cx={ENC.x + ENC.w - 22} cy={ENC.y + 25} r={2.5} className={cn(streaming ? "fill-success animate-led-blink" : "fill-primary")} />
        <text x={ENC.x + ENC.w / 2} y={ENC.y + 48} textAnchor="middle" className="fill-foreground font-mono text-[10px] font-semibold">
          ENC-01
        </text>
        <text x={ENC.x + ENC.w / 2} y={ENC.y + ENC.h + 16} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">
          {SIM_NETWORK.encoderIp}
        </text>
      </g>

      {/* Switch node */}
      <g>
        {streaming && (
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
          const up = port === 1 || (dec ? statuses[dec.id] !== "offline" : false);
          const live = streaming && (port === 1 || (dec && statuses[dec.id] === "online"));
          return (
            <g key={port}>
              <rect x={SW.x + 15 + i * 15.5} y={SW.y + 32} width={12} height={10} rx={1.5} className="fill-panel-inset stroke-border" />
              <rect
                x={SW.x + 17 + i * 15.5}
                y={SW.y + 34}
                width={8}
                height={2.5}
                className={cn(
                  live ? "fill-success animate-led-blink" : up ? "fill-primary" : "fill-muted-foreground/30",
                )}
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
        const live = streaming && status === "online";
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
            <text x={DEC_X + 12} y={y + 8} className="fill-muted-foreground text-[9px]">
              {d.room}
            </text>
            <text x={DEC_X + 12} y={y + 19} className="fill-muted-foreground/70 font-mono text-[7.5px]">
              port {d.switchPort} · {d.ip}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={H - 8} textAnchor="middle" className="fill-muted-foreground/70 font-mono text-[9px] tracking-widest">
        ONE SOURCE → MULTICAST → THREE IDENTICAL OUTPUTS (SIMULATED)
      </text>
    </svg>
  );
}
