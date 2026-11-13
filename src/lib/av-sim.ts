// Conceptual AV-over-IP simulation rules. No real hardware is contacted.

export type DecoderId = "dec1" | "dec2" | "dec3";
export type DecoderStatus = "online" | "offline" | "connecting";
export type DisplayState = "content" | "idle" | "connecting" | "no-signal";

export interface DecoderInfo {
  id: DecoderId;
  code: string;
  room: string;
  ip: string;
  switchPort: number;
}

/** Example settings only — clearly labelled as simulated in the UI. */
export const SIM_NETWORK = {
  vlan: 10,
  subnet: "192.168.10.0/24",
  gateway: "192.168.10.1",
  switchIp: "192.168.10.2",
  encoderIp: "192.168.10.10",
  multicastGroup: "239.10.10.1",
  udpPort: 5004,
  ttl: 4,
  codec: "H.264",
  resolution: "1920×1080 @ 60",
  igmp: "IGMPv2 snooping + querier",
  baseBitrateMbps: 18.4,
} as const;

export const DECODERS: DecoderInfo[] = [
  { id: "dec1", code: "DEC-01", room: "Canning Room", ip: "192.168.10.21", switchPort: 2 },
  { id: "dec2", code: "DEC-02", room: "Padang Room", ip: "192.168.10.22", switchPort: 3 },
  { id: "dec3", code: "DEC-03", room: "Collyer Room", ip: "192.168.10.23", switchPort: 4 },
];

/** What a room's display shows for a given stream + decoder state. */
export function getDisplayState(streaming: boolean, status: DecoderStatus): DisplayState {
  if (status === "offline") return "no-signal";
  if (status === "connecting") return streaming ? "connecting" : "idle";
  return streaming ? "content" : "idle";
}

/** Multicast: every online decoder receives the single encoder stream. */
export function receivingDecoders(
  streaming: boolean,
  statuses: Record<DecoderId, DecoderStatus>,
): DecoderId[] {
  return DECODERS.filter((d) => getDisplayState(streaming, statuses[d.id]) === "content").map(
    (d) => d.id,
  );
}

/** Content shown on a display, or null when blank. Every receiving display shows the same item. */
export function displayedContent<T>(
  streaming: boolean,
  status: DecoderStatus,
  currentContent: T,
): T | null {
  return getDisplayState(streaming, status) === "content" ? currentContent : null;
}

export function formatUptime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
