// Conceptual AV-over-IP simulation rules. No real hardware is contacted.

export type DecoderId = "dec1" | "dec2" | "dec3";
export type EncoderId = "enc1" | "enc2";
export type DecoderStatus = "online" | "offline" | "connecting";
export type DisplayState = "content" | "idle" | "connecting" | "no-signal";

export interface DecoderInfo {
  id: DecoderId;
  code: string;
  room: string;
  ip: string;
  switchPort: number;
}

export interface EncoderInfo {
  id: EncoderId;
  code: string;
  source: string;
  letter: "A" | "B";
  laptop: string;
  ip: string;
  multicastGroup: string;
  switchPort: number;
}

export type Subscriptions = Record<DecoderId, EncoderId>;
export type StreamingMap = Record<EncoderId, boolean>;

/** Example settings only — clearly labelled as simulated in the UI. */
export const SIM_NETWORK = {
  vlan: 10,
  subnet: "192.168.10.0/24",
  gateway: "192.168.10.1",
  switchIp: "192.168.10.2",
  udpPort: 5004,
  ttl: 4,
  codec: "H.264",
  resolution: "1920×1080 @ 60",
  igmp: "IGMPv2 snooping + querier",
  baseBitrateMbps: 18.4,
} as const;

export const ENCODERS: EncoderInfo[] = [
  {
    id: "enc1",
    code: "ENC-01",
    source: "Source A",
    letter: "A",
    laptop: "Laptop A",
    ip: "192.168.10.10",
    multicastGroup: "239.10.10.1",
    switchPort: 1,
  },
  {
    id: "enc2",
    code: "ENC-02",
    source: "Source B",
    letter: "B",
    laptop: "Laptop B",
    ip: "192.168.10.11",
    multicastGroup: "239.10.10.2",
    switchPort: 5,
  },
];

export const DECODERS: DecoderInfo[] = [
  { id: "dec1", code: "DEC-01", room: "Canning Room", ip: "192.168.10.21", switchPort: 2 },
  { id: "dec2", code: "DEC-02", room: "Padang Room", ip: "192.168.10.22", switchPort: 3 },
  { id: "dec3", code: "DEC-03", room: "Collyer Room", ip: "192.168.10.23", switchPort: 4 },
];

export const encoderById = (id: EncoderId) => ENCODERS.find((e) => e.id === id)!;
export const decoderById = (id: DecoderId) => DECODERS.find((d) => d.id === id)!;

/** Routing presets: which encoder's multicast group each decoder joins. */
export const ROUTING_PRESETS = {
  split: { dec1: "enc1", dec2: "enc2", dec3: "enc1" },
  allEnc1: { dec1: "enc1", dec2: "enc1", dec3: "enc1" },
} as const satisfies Record<string, Subscriptions>;
export type RoutingPreset = keyof typeof ROUTING_PRESETS;

/** Default demo: Canning + Collyer on ENC-01 (identical), Padang on ENC-02 (different). */
export const DEFAULT_SUBSCRIPTIONS: Subscriptions = { ...ROUTING_PRESETS.split };

/** Each encoder starts on a different slide so Source A and Source B are visibly different. */
export const DEFAULT_ENCODER_CONTENT: Record<EncoderId, string> = { enc1: "welcome", enc2: "programme" };

/** Both encoders stream on load so the 2 + 1 demonstration is visible immediately. */
export const DEFAULT_STREAMING: StreamingMap = { enc1: true, enc2: true };

/** What a room's display shows for a given stream + decoder state. */
export function getDisplayState(streaming: boolean, status: DecoderStatus): DisplayState {
  if (status === "offline") return "no-signal";
  if (status === "connecting") return streaming ? "connecting" : "idle";
  return streaming ? "content" : "idle";
}

/** Display state for a decoder, using the stream state of the encoder it is subscribed to. */
export function decoderDisplayState(
  streaming: StreamingMap,
  status: DecoderStatus,
  encoder: EncoderId,
): DisplayState {
  return getDisplayState(streaming[encoder], status);
}

/** Multicast: online decoders receive the stream of the encoder group they joined. */
export function receivingDecoders(
  streaming: StreamingMap,
  statuses: Record<DecoderId, DecoderStatus>,
  subscriptions: Subscriptions,
  encoder?: EncoderId,
): DecoderId[] {
  return DECODERS.filter(
    (d) =>
      (encoder === undefined || subscriptions[d.id] === encoder) &&
      decoderDisplayState(streaming, statuses[d.id], subscriptions[d.id]) === "content",
  ).map((d) => d.id);
}

/** Content shown on a display, or null when blank. Decoders on the same encoder always match. */
export function displayedContent<T>(
  streaming: StreamingMap,
  status: DecoderStatus,
  encoder: EncoderId,
  contentByEncoder: Record<EncoderId, T>,
): T | null {
  return decoderDisplayState(streaming, status, encoder) === "content" ? contentByEncoder[encoder] : null;
}

/** Decoders that have joined an encoder's multicast group (whatever their link state). */
export function subscribersOf(subscriptions: Subscriptions, encoder: EncoderId): DecoderId[] {
  return DECODERS.filter((d) => subscriptions[d.id] === encoder).map((d) => d.id);
}

/** Source A and Source B are separate laptops, so they never play the same slide. */
export function canSelectContent(
  encoder: EncoderId,
  contentId: string,
  contentByEncoder: Record<EncoderId, string>,
): boolean {
  return ENCODERS.every((e) => e.id === encoder || contentByEncoder[e.id] !== contentId);
}

export function matchPreset(subscriptions: Subscriptions): RoutingPreset | null {
  const keys = Object.keys(ROUTING_PRESETS) as RoutingPreset[];
  return (
    keys.find((k) => DECODERS.every((d) => ROUTING_PRESETS[k][d.id] === subscriptions[d.id])) ?? null
  );
}

export function formatUptime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
