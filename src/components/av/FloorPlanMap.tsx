import floorPlan from "@/assets/raffles-level4-floorplan.png.asset.json";
import { DECODERS, getDisplayState, type DecoderId, type DecoderStatus } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";

// Coordinates are in the uploaded floor-plan image's pixel space (1672 × 941).
const IMG_W = 1672;
const IMG_H = 941;

const BRANCH_X: Record<DecoderId, number> = { dec1: 397, dec2: 640, dec3: 881 };
const SCREEN_X: Record<DecoderId, number> = { dec1: 352, dec2: 592, dec3: 832 };
const PILL_X: Record<DecoderId, number> = { dec1: 446, dec2: 686, dec3: 928 };
const ethPath = (x: number) => `M737 570 V502 H${x} V424`;

const ENC = { x: 610, y: 587 };
const SWITCH = { x: 740, y: 585 };

function linkRank(streaming: boolean, status: DecoderStatus) {
  if (status === "offline") return 0;
  if (status === "connecting") return 1;
  return streaming ? 3 : 2;
}

function Marker({ x, y, label, live }: { x: number; y: number; label: string; live: boolean }) {
  return (
    <g>
      <circle cx={x} cy={y} r={40} className={cn("fill-none", live ? "stroke-success" : "stroke-primary")} strokeWidth={3} />
      <circle
        cx={x}
        cy={y}
        r={40}
        className={cn("fill-none animate-pulse-ring", live ? "stroke-success" : "stroke-primary")}
        strokeWidth={3}
        style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}
      />
      <title>{label} (proposed location)</title>
    </g>
  );
}

export function FloorPlanMap() {
  const { streaming, statuses, content } = useSimulation();

  return (
    <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="size-full" role="img" aria-label="Raffles City Convention Centre Level 4 floor plan with simulated equipment">
      <defs>
        {DECODERS.map((d) => (
          <path key={d.id} id={`fp-${d.id}`} d={ethPath(BRANCH_X[d.id])} />
        ))}
        <path id="fp-hdmi" d={`M525 589 H562`} />
        <path id="fp-enc-sw" d={`M654 589 H684`} />
      </defs>

      <image href={floorPlan.url} width={IMG_W} height={IMG_H} />

      {/* HDMI: laptop → encoder; encoder → switch */}
      <use href="#fp-hdmi" className="fill-none stroke-hdmi animate-dash-flow" strokeWidth={6} strokeDasharray="8 4" />
      <use
        href="#fp-enc-sw"
        className={cn("fill-none animate-dash-flow", streaming ? "stroke-success" : "stroke-primary")}
        strokeWidth={6}
        strokeDasharray="8 4"
      />

      {/* Ethernet: switch → decoders. Healthy links draw last so shared trunk segments show the live path. */}
      {[...DECODERS]
        .sort((a, b) => linkRank(streaming, statuses[a.id]) - linkRank(streaming, statuses[b.id]))
        .map((d) => {
        const status = statuses[d.id];
        const live = streaming && status === "online";
        return (
          <g key={d.id}>
            <use
              href={`#fp-${d.id}`}
              strokeWidth={live ? 9 : 7}
              strokeLinejoin="round"
              className={cn(
                "fill-none transition-colors",
                status === "offline" ? "stroke-destructive" : status === "connecting" ? "stroke-warning" : live ? "stroke-success/80" : "stroke-primary/80",
              )}
              strokeDasharray={status === "offline" ? "14 10" : undefined}
            />
            {live && (
              <use
                href={`#fp-${d.id}`}
                strokeWidth={3}
                strokeLinejoin="round"
                className="fill-none stroke-foreground/90 animate-dash-flow"
                strokeDasharray="8 4"
              />
            )}
            {live &&
              Array.from({ length: 4 }).map((_, i) => (
                <circle key={i} r={8} className="fill-success stroke-foreground" strokeWidth={2}>
                  <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${-i * 0.6}s`}>
                    <mpath href={`#fp-${d.id}`} />
                  </animateMotion>
                </circle>
              ))}
          </g>
        );
      })}

      {/* Displays: overlay what each room's screen is showing */}
      {DECODERS.map((d) => {
        const state = getDisplayState(streaming, statuses[d.id]);
        const x = SCREEN_X[d.id];
        return (
          <g key={d.id}>
            {state === "content" ? (
              <image
                href={content.src}
                x={x}
                y={286}
                width={84}
                height={41}
                preserveAspectRatio="xMidYMid slice"
                className="animate-screen-in"
              />
            ) : (
              <rect x={x} y={286} width={84} height={41} className={state === "no-signal" ? "fill-destructive" : "fill-screen"} />
            )}
            {state === "no-signal" && (
              <text x={x + 42} y={311} textAnchor="middle" className="fill-destructive-foreground font-mono text-[10px] font-bold">
                NO SIGNAL
              </text>
            )}
            <g transform={`translate(${PILL_X[d.id]} 398)`}>
              <rect
                x={0}
                y={-11}
                width={66}
                height={22}
                rx={11}
                className={cn(
                  statuses[d.id] === "offline" ? "fill-destructive" : statuses[d.id] === "connecting" ? "fill-warning" : state === "content" ? "fill-success" : "fill-primary",
                )}
              />
              <text x={33} y={4} textAnchor="middle" className="fill-primary-foreground font-mono text-[10px] font-bold">
                {statuses[d.id] === "offline" ? "OFFLINE" : statuses[d.id] === "connecting" ? "JOINING" : state === "content" ? "LIVE" : "ONLINE"}
              </text>
            </g>
          </g>
        );
      })}

      <Marker x={ENC.x} y={ENC.y} label="ENC-01" live={streaming} />
      <Marker x={SWITCH.x} y={SWITCH.y} label="SW-01" live={streaming} />
    </svg>
  );
}
