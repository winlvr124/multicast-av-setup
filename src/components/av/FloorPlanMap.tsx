import floorPlan from "@/assets/raffles-city-av-layout.png";
import { DECODERS, decoderDisplayState, type DecoderId, type DecoderStatus } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";
import { sourceFill } from "./SourceControls";

// Coordinates are in the uploaded floor-plan image's pixel space (1672 × 941).
// The image already shows the laptops, ENC-01, ENC-02, the managed switch and
// the decoders, so the overlay only adds the live simulation state: animated
// Ethernet paths (aligned with the image's own blue links), what each room's
// display is showing, and per-room status pills.
const IMG_W = 1672;
const IMG_H = 941;

const BRANCH_X: Record<DecoderId, number> = { dec1: 397, dec2: 640, dec3: 881 };
const SCREEN_X: Record<DecoderId, number> = { dec1: 352, dec2: 592, dec3: 832 };
const PILL_X: Record<DecoderId, number> = { dec1: 446, dec2: 686, dec3: 928 };
// Trunk rises from the switch top, branches across, then arrows up to each decoder.
const ethPath = (x: number) => `M790 548 V470 H${x} V398`;

function linkRank(live: boolean, status: DecoderStatus) {
  if (status === "offline") return 0;
  if (status === "connecting") return 1;
  return live ? 3 : 2;
}

function Letter({ x, y, enc }: { x: number; y: number; enc: "enc1" | "enc2" }) {
  return (
    <g>
      <rect x={x - 11} y={y - 11} width={22} height={22} rx={5} className={sourceFill[enc]} />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-primary-foreground font-mono text-[13px] font-bold">
        {enc === "enc1" ? "A" : "B"}
      </text>
    </g>
  );
}

export function FloorPlanMap() {
  const { streaming, statuses, contentByEncoder, subscriptions } = useSimulation();
  const liveDec = (id: DecoderId) => decoderDisplayState(streaming, statuses[id], subscriptions[id]) === "content";

  return (
    <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="size-full" role="img" aria-label="Raffles City Convention Centre Level 4 floor plan with simulated equipment">
      <defs>
        {DECODERS.map((d) => (
          <path key={d.id} id={`fp-${d.id}`} d={ethPath(BRANCH_X[d.id])} />
        ))}
      </defs>

      <image href={floorPlan} width={IMG_W} height={IMG_H} />

      {/* Ethernet: switch → decoders, aligned with the links drawn in the image.
          Healthy links draw last so shared trunk segments show the live path. */}
      {[...DECODERS]
        .sort((a, b) => linkRank(liveDec(a.id), statuses[a.id]) - linkRank(liveDec(b.id), statuses[b.id]))
        .map((d) => {
          const status = statuses[d.id];
          const live = liveDec(d.id);
          return (
            <g key={d.id}>
              {live &&
                Array.from({ length: 4 }).map((_, i) => (
                  <circle key={i} r={8} className={cn(sourceFill[subscriptions[d.id]], "stroke-foreground")} strokeWidth={2}>
                    <animateMotion dur="2.4s" repeatCount="indefinite" begin={`${-i * 0.6}s`}>
                      <mpath href={`#fp-${d.id}`} />
                    </animateMotion>
                  </circle>
                ))}
              {status === "offline" && (
                <use
                  href={`#fp-${d.id}`}
                  strokeWidth={7}
                  strokeLinejoin="round"
                  className="fill-none stroke-destructive"
                  strokeDasharray="14 10"
                />
              )}
              {status === "connecting" && (
                <use href={`#fp-${d.id}`} strokeWidth={7} strokeLinejoin="round" className="fill-none stroke-warning animate-dash-flow" strokeDasharray="8 4" />
              )}
            </g>
          );
        })}

      {/* Displays: overlay what each room's screen is showing */}
      {DECODERS.map((d) => {
        const enc = subscriptions[d.id];
        const state = decoderDisplayState(streaming, statuses[d.id], enc);
        const x = SCREEN_X[d.id];
        const content = contentByEncoder[enc];
        return (
          <g key={d.id}>
            {state === "content" ? (
              <image
                key={content.id}
                href={content.src}
                x={x}
                y={268}
                width={84}
                height={47}
                preserveAspectRatio="xMidYMid slice"
                className="animate-screen-in"
              />
            ) : (
              <rect x={x} y={268} width={84} height={47} rx={3} className={state === "no-signal" ? "fill-destructive" : "fill-screen"} />
            )}
            {state === "no-signal" && (
              <text x={x + 42} y={296} textAnchor="middle" className="fill-destructive-foreground font-mono text-[10px] font-bold">
                NO SIGNAL
              </text>
            )}
            <Letter x={x - 14} y={282} enc={enc} />
            <g transform={`translate(${PILL_X[d.id]} 292)`}>
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
    </svg>
  );
}
