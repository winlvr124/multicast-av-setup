import floorPlan from "@/assets/raffles-city-av-layout.png";
import {
  DECODERS,
  ENCODERS,
  decoderDisplayState,
  type DecoderId,
  type DecoderStatus,
  type EncoderId,
} from "@/lib/av-sim";
import { cn } from "@/lib/utils";
import { useSimulation } from "./SimulationContext";
import { sourceFill } from "./SourceControls";

// Coordinates are in the uploaded floor-plan image's pixel space (1672 × 941).
// The image already shows the laptops, ENC-01, ENC-02, the managed switch and
// the decoders, so the overlay only adds live simulation state on top of the
// image's own drawn links: animated HDMI, encoder → switch and switch → decoder
// paths, what each room's display is showing, and per-room status pills.
const IMG_W = 1672;
const IMG_H = 941;

const sourceStroke: Record<EncoderId, string> = { enc1: "stroke-source-a", enc2: "stroke-source-b" };

// Laptop → encoder HDMI arrows (purple in the image).
const HDMI_PATH: Record<EncoderId, string> = {
  enc1: "M438 535 H472",
  enc2: "M438 621 H472",
};
// Encoder → switch, following the green (ENC-01) and blue (ENC-02) lines in the image.
const UPLINK_PATH: Record<EncoderId, string> = {
  enc1: "M584 537 H641 Q654 537 654 550 V556 Q654 569 667 569 H706",
  enc2: "M584 621 H642 Q655 621 655 608 V603 Q655 590 668 590 H706",
};

const BRANCH_X: Record<DecoderId, number> = { dec1: 397, dec2: 640, dec3: 881 };
const SCREEN_X: Record<DecoderId, number> = { dec1: 352, dec2: 592, dec3: 832 };
const PILL_X: Record<DecoderId, number> = { dec1: 446, dec2: 686, dec3: 928 };
// Each multicast group gets its own lane through the shared trunk so both
// streams stay visible side by side leaving the switch.
const LANE: Record<EncoderId, { dx: number; dy: number }> = { enc1: { dx: -7, dy: -6 }, enc2: { dx: 7, dy: 6 } };
// Switch top → up the trunk → across → up to the decoder's arrow.
const downlinkPath = (dec: DecoderId, enc: EncoderId) => {
  const { dx, dy } = LANE[enc];
  return `M${790 + dx} 550 V${470 + dy} H${BRANCH_X[dec]} V398`;
};

function linkRank(live: boolean, status: DecoderStatus) {
  if (status === "offline") return 0;
  if (status === "connecting") return 1;
  return live ? 3 : 2;
}

function Packets({ path, enc, count, dur }: { path: string; enc: EncoderId; count: number; dur: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <circle key={i} r={7} className={cn(sourceFill[enc], "stroke-foreground")} strokeWidth={2}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${(-i * dur) / count}s`}>
            <mpath href={`#${path}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}

/** Glowing, flowing line for an active multicast link. */
function LiveLine({ path, stroke }: { path: string; stroke: string }) {
  return (
    <>
      <use href={`#${path}`} strokeWidth={16} strokeLinejoin="round" strokeLinecap="round" className={cn("fill-none opacity-30", stroke)} />
      <use href={`#${path}`} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" className={cn("fill-none", stroke)} />
      <use
        href={`#${path}`}
        strokeWidth={2.5}
        strokeLinejoin="round"
        className="fill-none stroke-foreground/80 animate-dash-flow"
        strokeDasharray="8 4"
      />
    </>
  );
}

/** Greyed-out link: physically connected but not carrying a stream. */
function IdleLine({ path }: { path: string }) {
  return (
    <use
      href={`#${path}`}
      strokeWidth={7}
      strokeLinejoin="round"
      strokeLinecap="round"
      className="fill-none stroke-muted-foreground/80"
      strokeDasharray="10 8"
    />
  );
}

function Letter({ x, y, enc }: { x: number; y: number; enc: EncoderId }) {
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
    <svg viewBox={`0 0 ${IMG_W} ${IMG_H}`} className="size-full" role="img" aria-label="Raffles City Convention Centre Level 4 floor plan with simulated multicast streams">
      <defs>
        {ENCODERS.map((e) => (
          <g key={e.id}>
            <path id={`fp-hdmi-${e.id}`} d={HDMI_PATH[e.id]} />
            <path id={`fp-up-${e.id}`} d={UPLINK_PATH[e.id]} />
          </g>
        ))}
        {DECODERS.map((d) => (
          <path key={d.id} id={`fp-down-${d.id}`} d={downlinkPath(d.id, subscriptions[d.id])} />
        ))}
      </defs>

      <image href={floorPlan} width={IMG_W} height={IMG_H} />

      {/* Laptop → encoder (HDMI) and encoder → switch (multicast uplink) */}
      {ENCODERS.map((e) =>
        streaming[e.id] ? (
          <g key={e.id}>
            <use
              href={`#fp-hdmi-${e.id}`}
              strokeWidth={6}
              strokeLinecap="round"
              className="fill-none stroke-hdmi animate-dash-flow"
              strokeDasharray="8 4"
            />
            <LiveLine path={`fp-up-${e.id}`} stroke={sourceStroke[e.id]} />
            <Packets path={`fp-up-${e.id}`} enc={e.id} count={3} dur={1.5} />
          </g>
        ) : (
          <IdleLine key={e.id} path={`fp-up-${e.id}`} />
        ),
      )}

      {/* Switch → decoders. Healthy links draw last so shared trunk segments show the live paths. */}
      {[...DECODERS]
        .sort((a, b) => linkRank(liveDec(a.id), statuses[a.id]) - linkRank(liveDec(b.id), statuses[b.id]))
        .map((d) => {
          const status = statuses[d.id];
          const path = `fp-down-${d.id}`;
          if (status === "offline")
            return (
              <use
                key={d.id}
                href={`#${path}`}
                strokeWidth={7}
                strokeLinejoin="round"
                className="fill-none stroke-destructive"
                strokeDasharray="14 10"
              />
            );
          if (status === "connecting")
            return (
              <use
                key={d.id}
                href={`#${path}`}
                strokeWidth={7}
                strokeLinejoin="round"
                className="fill-none stroke-warning animate-dash-flow"
                strokeDasharray="8 4"
              />
            );
          if (!liveDec(d.id)) return <IdleLine key={d.id} path={path} />;
          return <LiveLine key={d.id} path={path} stroke={sourceStroke[subscriptions[d.id]]} />;
        })}

      {/* Packets on top of every line so both streams stay visible on the shared trunk */}
      {DECODERS.filter((d) => liveDec(d.id)).map((d) => (
        <Packets key={`${d.id}-${subscriptions[d.id]}`} path={`fp-down-${d.id}`} enc={subscriptions[d.id]} count={5} dur={3} />
      ))}

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
