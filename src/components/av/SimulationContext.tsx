import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  DECODERS,
  DEFAULT_ENCODER_CONTENT,
  DEFAULT_STREAMING,
  DEFAULT_SUBSCRIPTIONS,
  ENCODERS,
  ROUTING_PRESETS,
  SIM_NETWORK,
  canSelectContent,
  decoderById,
  encoderById,
  type DecoderId,
  type DecoderStatus,
  type EncoderId,
  type RoutingPreset,
  type StreamingMap,
  type Subscriptions,
} from "@/lib/av-sim";
import { DEFAULT_SIGNAGE, SIGNAGE, type SignageItem } from "./signage";

export interface LogEntry {
  id: number;
  time: string;
  level: "info" | "ok" | "warn";
  message: string;
}

export interface EncoderStats {
  uptime: number;
  bitrate: number;
  packets: number;
}

interface SimulationValue {
  streaming: StreamingMap;
  anyStreaming: boolean;
  contentByEncoder: Record<EncoderId, SignageItem>;
  contentIds: Record<EncoderId, string>;
  setContentId: (encoder: EncoderId, id: string) => void;
  start: (encoder: EncoderId) => void;
  stop: (encoder: EncoderId) => void;
  stats: Record<EncoderId, EncoderStats>;
  subscriptions: Subscriptions;
  subscribe: (decoder: DecoderId, encoder: EncoderId) => void;
  applyPreset: (preset: RoutingPreset) => void;
  statuses: Record<DecoderId, DecoderStatus>;
  disconnect: (id: DecoderId) => void;
  reconnect: (id: DecoderId) => void;
  log: LogEntry[];
}

const SimulationContext = createContext<SimulationValue | null>(null);

const RECONNECT_MS = 1600;
const REJOIN_MS = 700;
const zeroStats = (): EncoderStats => ({ uptime: 0, bitrate: 0, packets: 0 });

function nowLabel() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [streaming, setStreaming] = useState<StreamingMap>({ ...DEFAULT_STREAMING });
  const [contentIds, setContentIds] = useState<Record<EncoderId, string>>({ ...DEFAULT_ENCODER_CONTENT });
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({ ...DEFAULT_SUBSCRIPTIONS });
  const [statuses, setStatuses] = useState<Record<DecoderId, DecoderStatus>>({
    dec1: "online",
    dec2: "online",
    dec3: "online",
  });
  const [stats, setStats] = useState<Record<EncoderId, EncoderStats>>(() => ({
    enc1: { ...zeroStats(), bitrate: DEFAULT_STREAMING.enc1 ? SIM_NETWORK.baseBitrateMbps : 0 },
    enc2: { ...zeroStats(), bitrate: DEFAULT_STREAMING.enc2 ? SIM_NETWORK.baseBitrateMbps : 0 },
  }));
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const streamingRef = useRef(streaming);
  streamingRef.current = streaming;
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;
  const subsRef = useRef(subscriptions);
  subsRef.current = subscriptions;
  const contentRef = useRef(contentIds);
  contentRef.current = contentIds;

  const push = useCallback((message: string, level: LogEntry["level"] = "info") => {
    logId.current += 1;
    const entry = { id: logId.current, time: nowLabel(), level, message };
    setLog((prev) => [entry, ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    push("Simulation ready — all devices are virtual (no hardware connected)");
    ENCODERS.forEach((e) => {
      if (DEFAULT_STREAMING[e.id]) push(`${e.code} (${e.source}) streaming → ${e.multicastGroup}:${SIM_NETWORK.udpPort}`, "ok");
    });
    push("Default demo: Canning + Collyer on ENC-01 (identical) · Padang on ENC-02 (different)");
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, [push]);

  const anyStreaming = ENCODERS.some((e) => streaming[e.id]);

  useEffect(() => {
    if (!anyStreaming) return;
    const iv = setInterval(() => {
      setStats((prev) => {
        const next = { ...prev };
        ENCODERS.forEach((e) => {
          if (!streamingRef.current[e.id]) return;
          const rate = SIM_NETWORK.baseBitrateMbps + (Math.random() - 0.5) * 1.2;
          next[e.id] = {
            uptime: prev[e.id].uptime + 1,
            bitrate: rate,
            packets: prev[e.id].packets + Math.round((rate * 1_000_000) / 8 / 1316),
          };
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [anyStreaming]);

  const start = useCallback(
    (id: EncoderId) => {
      if (streamingRef.current[id]) return;
      const e = encoderById(id);
      setStreaming((s) => ({ ...s, [id]: true }));
      setStats((s) => ({ ...s, [id]: { uptime: 0, packets: 0, bitrate: SIM_NETWORK.baseBitrateMbps } }));
      push(`${e.code} (${e.source}) streaming → ${e.multicastGroup}:${SIM_NETWORK.udpPort} (simulated)`, "ok");
      DECODERS.forEach((d) => {
        if (subsRef.current[d.id] === id && statusesRef.current[d.id] === "online")
          push(`IGMP join ${e.multicastGroup} from ${d.code} · port ${d.switchPort}`);
      });
    },
    [push],
  );

  const stop = useCallback(
    (id: EncoderId) => {
      if (!streamingRef.current[id]) return;
      const e = encoderById(id);
      setStreaming((s) => ({ ...s, [id]: false }));
      setStats((s) => ({ ...s, [id]: { ...s[id], bitrate: 0 } }));
      const rooms = DECODERS.filter((d) => subsRef.current[d.id] === id).map((d) => d.room.replace(" Room", ""));
      push(`${e.code} stream stopped — ${rooms.length ? `${rooms.join(" + ")} blanked` : "no subscribed displays"}`, "warn");
    },
    [push],
  );

  const setContentId = useCallback(
    (encoder: EncoderId, id: string) => {
      if (!canSelectContent(encoder, id, contentRef.current)) return;
      setContentIds((c) => ({ ...c, [encoder]: id }));
      const item = SIGNAGE.find((s) => s.id === id);
      const e = encoderById(encoder);
      if (item) push(`${e.laptop} → ${e.code} source changed to “${item.title}”`);
    },
    [push],
  );

  const rejoin = useCallback(
    (dec: DecoderId, from: EncoderId, to: EncoderId) => {
      const d = decoderById(dec);
      const a = encoderById(from);
      const b = encoderById(to);
      setSubscriptions((s) => ({ ...s, [dec]: to }));
      if (statusesRef.current[dec] === "offline") {
        push(`${d.code} will join ${b.multicastGroup} (${b.code}) when back online`);
        return;
      }
      clearTimeout(timers.current[dec]);
      setStatuses((s) => ({ ...s, [dec]: "connecting" }));
      push(`IGMP leave ${a.multicastGroup} · join ${b.multicastGroup} from ${d.code} (${d.room})`);
      timers.current[dec] = setTimeout(() => {
        setStatuses((s) => ({ ...s, [dec]: "online" }));
        push(
          streamingRef.current[to]
            ? `${d.code} receiving ${b.code} · ${b.source}`
            : `${d.code} joined ${b.code} — waiting for stream`,
          "ok",
        );
      }, REJOIN_MS);
    },
    [push],
  );

  const subscribe = useCallback(
    (dec: DecoderId, to: EncoderId) => {
      const from = subsRef.current[dec];
      if (from !== to) rejoin(dec, from, to);
    },
    [rejoin],
  );

  const applyPreset = useCallback(
    (preset: RoutingPreset) => {
      push(
        preset === "allEnc1"
          ? "Routing preset: all three decoders join ENC-01 (one multicast stream)"
          : "Routing preset: Canning + Collyer on ENC-01, Padang on ENC-02",
      );
      DECODERS.forEach((d) => {
        const to = ROUTING_PRESETS[preset][d.id];
        const from = subsRef.current[d.id];
        if (from !== to) rejoin(d.id, from, to);
      });
    },
    [push, rejoin],
  );

  const disconnect = useCallback(
    (id: DecoderId) => {
      const d = decoderById(id);
      clearTimeout(timers.current[id]);
      setStatuses((s) => ({ ...s, [id]: "offline" }));
      push(`${d.code} link down on switch port ${d.switchPort} (${d.room})`, "warn");
    },
    [push],
  );

  const reconnect = useCallback(
    (id: DecoderId) => {
      const d = decoderById(id);
      setStatuses((s) => ({ ...s, [id]: "connecting" }));
      push(`${d.code} link up — negotiating ${d.ip}`);
      timers.current[id] = setTimeout(() => {
        const e = encoderById(subsRef.current[id]);
        setStatuses((s) => ({ ...s, [id]: "online" }));
        push(
          streamingRef.current[e.id]
            ? `IGMP join ${e.multicastGroup} from ${d.code} — receiving ${e.code}`
            : `${d.code} online — waiting for ${e.code} stream`,
          "ok",
        );
      }, RECONNECT_MS);
    },
    [push],
  );

  const find = (id: string) => SIGNAGE.find((s) => s.id === id) ?? DEFAULT_SIGNAGE;
  const contentByEncoder = { enc1: find(contentIds.enc1), enc2: find(contentIds.enc2) };

  return (
    <SimulationContext.Provider
      value={{
        streaming,
        anyStreaming,
        contentByEncoder,
        contentIds,
        setContentId,
        start,
        stop,
        stats,
        subscriptions,
        subscribe,
        applyPreset,
        statuses,
        disconnect,
        reconnect,
        log,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used inside SimulationProvider");
  return ctx;
}
