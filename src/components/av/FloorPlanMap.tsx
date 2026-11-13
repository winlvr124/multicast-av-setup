import floorPlan from "@/assets/raffles-level4-floorplan.png.asset.json";
import { DECODERS, ENCODERS, decoderDisplayState, type DecoderId, type DecoderStatus } from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";
import { sourceFill } from "./SourceControls";

// Coordinates are in the uploaded floor-plan image's pixel space (1672 × 941).
const IMG_W = 1672;
const IMG_H = 941;

const BRANCH_X: Record<DecoderId, number> = { dec1: 397, dec2: 640, dec3: 881 };
const SCREEN_X: Record<DecoderId, number> = { dec1: 352, dec2: 592, dec3: 832 };
const PILL_X: Record<DecoderId, number> = { dec1: 446, dec2: 686, dec3: 928 };
const ethPath = (x: number) => `M737 570 V502 H${x} V424`;

const ENC1 = { x: 610, y: 587 };
const ENC2 = { x: 870, y: 589 };
const SWITCH = { x: 740, y: 585 };

function linkRank(live: boolean, status: DecoderStatus) {
  if (status === "offline") return 0;
  if (status === "connecting") return 1;
  return live ? 3 : 2;
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
      <title>{`${label} (proposed location)`}</title>
    </g>
  );
}

function Letter({ x, y, enc }: { x: number; y: number; enc: "enc1" | "enc2" }) {
  const e = ENCODERS.find((v) => v.id === enc)!;
  return (
    <g>
      <rect x={x - 11} y={y - 11} width={22} height={22} rx={5} className={sourceFill[enc]} />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-primary-foreground font-mono text-[13px] font-bold">
        {e.letter}
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
        <path id="fp-hdmi" d="M525 589 H562" />
        <path id="fp-enc-sw" d="M654 589 H684" />
        <path id="fp-hdmi-b" d="M870 648 V606" />
        <path id="fp-enc2-sw" d="M836 589 H792" />
      </defs>

      <image href={floorPlan.url} width={IMG_W} height={IMG_H} />

      {/* Proposed ENC-02 + Laptop B (overlay — not in the original drawing) */}
      <g>
        <rect x={838} y={577} width={64} height={24} rx={4} className="fill-card stroke-primary" strokeWidth={2} />
        <circle cx={890} cy={589} r={3} className={streaming.enc2 ? "fill-success animate-led-blink" : "fill-primary"} />
        <rect x={906} y={578} width={58} height={22} rx={11} className="fill-primary" />
        <text x={935} y={593} textAnchor="middle" className="fill-primary-foreground font-mono text-[11px] font-bold">
          ENC 2
        </text>
        <rect x={850} y={650} width={40} height={26} rx={2} className="fill-secondary stroke-primary" strokeWidth={2} />
        <rect x={844} y={676} width={52} height={5} rx={2} className="fill-muted-foreground" />
        <text x={905} y={670} className="fill-foreground font-mono text-[10px] font-bold">
          Laptop B
        </text>
      </g>

      {/* HDMI: laptops → encoders; encoders → switch */}
      <use href="#fp-hdmi" className="fill-none stroke-hdmi animate-dash-flow" strokeWidth={6} strokeDasharray="8 4" />
      <use href="#fp-hdmi-b" className="fill-none stroke-hdmi animate-dash-flow" strokeWidth={6} strokeDasharray="8 4" />
      <use
        href="#fp-enc-sw"
        className={cn("fill-none animate-dash-flow", streaming.enc1 ? "stroke-success" : "stroke-primary")}
        strokeWidth={6}
        strokeDasharray="8 4"
      />
      <use
        href="#fp-enc2-sw"
        className={cn("fill-none animate-dash-flow", streaming.enc2 ? "stroke-success" : "stroke-primary")}
        strokeWidth={6}
        strokeDasharray="8 4"
      />

      {/* Ethernet: switch → decoders. Healthy links draw last so shared trunk segments show the live path. */}
      {[...DECODERS]
        .sort((a, b) => linkRank(liveDec(a.id), statuses[a.id]) - linkRank(liveDec(b.id), statuses[b.id]))
        .map((d) => {
          const status = statuses[d.id];
          const live = liveDec(d.id);
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
                  <circle key={i} r={8} className={cn(sourceFill[subscriptions[d.id]], "stroke-foreground")} strokeWidth={2}>
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
            <Letter x={x - 14} y={300} enc={enc} />
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

      <Letter x={ENC1.x - 30} y={ENC1.y - 30} enc="enc1" />
      <Letter x={ENC2.x - 30} y={ENC2.y - 30} enc="enc2" />
      <Marker x={ENC1.x} y={ENC1.y} label="ENC-01 · Source A" live={streaming.enc1} />
      <Marker x={ENC2.x} y={ENC2.y} label="ENC-02 · Source B" live={streaming.enc2} />
      <Marker x={SWITCH.x} y={SWITCH.y} label="SW-01" live={streaming.enc1 || streaming.enc2} />
    </svg>
  );
}
