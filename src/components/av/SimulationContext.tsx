import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DECODERS, SIM_NETWORK, type DecoderId, type DecoderStatus } from "@/lib/av-sim";
import { DEFAULT_SIGNAGE, SIGNAGE, type SignageItem } from "./signage";

export interface LogEntry {
  id: number;
  time: string;
  level: "info" | "ok" | "warn";
  message: string;
}

interface SimulationValue {
  streaming: boolean;
  content: SignageItem;
  setContentId: (id: string) => void;
  start: () => void;
  stop: () => void;
  statuses: Record<DecoderId, DecoderStatus>;
  disconnect: (id: DecoderId) => void;
  reconnect: (id: DecoderId) => void;
  uptime: number;
  bitrate: number;
  packets: number;
  log: LogEntry[];
}

const SimulationContext = createContext<SimulationValue | null>(null);

const RECONNECT_MS = 1600;

function nowLabel() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [streaming, setStreaming] = useState(false);
  const [contentId, setContentIdState] = useState(DEFAULT_SIGNAGE.id);
  const [statuses, setStatuses] = useState<Record<DecoderId, DecoderStatus>>({
    dec1: "online",
    dec2: "online",
    dec3: "online",
  });
  const [uptime, setUptime] = useState(0);
  const [bitrate, setBitrate] = useState(0);
  const [packets, setPackets] = useState(0);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const streamingRef = useRef(streaming);
  streamingRef.current = streaming;
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  const push = useCallback((message: string, level: LogEntry["level"] = "info") => {
    logId.current += 1;
    const entry = { id: logId.current, time: nowLabel(), level, message };
    setLog((prev) => [entry, ...prev].slice(0, 40));
  }, []);

  useEffect(() => {
    push("Simulation ready — all devices are virtual (no hardware connected)");
    const t = timers.current;
    return () => Object.values(t).forEach(clearTimeout);
  }, [push]);

  useEffect(() => {
    if (!streaming) return;
    const iv = setInterval(() => {
      setUptime((u) => u + 1);
      const rate = SIM_NETWORK.baseBitrateMbps + (Math.random() - 0.5) * 1.2;
      setBitrate(rate);
      setPackets((p) => p + Math.round((rate * 1_000_000) / 8 / 1316));
    }, 1000);
    return () => clearInterval(iv);
  }, [streaming]);

  const start = useCallback(() => {
    if (streamingRef.current) return;
    setStreaming(true);
    setUptime(0);
    setPackets(0);
    setBitrate(SIM_NETWORK.baseBitrateMbps);
    push(`ENC-01 streaming → ${SIM_NETWORK.multicastGroup}:${SIM_NETWORK.udpPort} (simulated)`, "ok");
    DECODERS.forEach((d) => {
      if (statusesRef.current[d.id] === "online")
        push(`IGMP join ${SIM_NETWORK.multicastGroup} from ${d.code} · port ${d.switchPort}`);
    });
  }, [push]);

  const stop = useCallback(() => {
    if (!streamingRef.current) return;
    setStreaming(false);
    setBitrate(0);
    push("ENC-01 stream stopped — displays blanked", "warn");
  }, [push]);

  const setContentId = useCallback(
    (id: string) => {
      setContentIdState(id);
      const item = SIGNAGE.find((s) => s.id === id);
      if (item) push(`Laptop source changed to “${item.title}”`);
    },
    [push],
  );

  const disconnect = useCallback(
    (id: DecoderId) => {
      const d = DECODERS.find((x) => x.id === id)!;
      clearTimeout(timers.current[id]);
      setStatuses((s) => ({ ...s, [id]: "offline" }));
      push(`${d.code} link down on switch port ${d.switchPort} (${d.room})`, "warn");
    },
    [push],
  );

  const reconnect = useCallback(
    (id: DecoderId) => {
      const d = DECODERS.find((x) => x.id === id)!;
      setStatuses((s) => ({ ...s, [id]: "connecting" }));
      push(`${d.code} link up — negotiating ${d.ip}`);
      timers.current[id] = setTimeout(() => {
        setStatuses((s) => ({ ...s, [id]: "online" }));
        push(
          streamingRef.current
            ? `IGMP join ${SIM_NETWORK.multicastGroup} from ${d.code} — receiving stream`
            : `${d.code} online — waiting for stream`,
          "ok",
        );
      }, RECONNECT_MS);
    },
    [push],
  );

  const content = SIGNAGE.find((s) => s.id === contentId) ?? DEFAULT_SIGNAGE;

  return (
    <SimulationContext.Provider
      value={{ streaming, content, setContentId, start, stop, statuses, disconnect, reconnect, uptime, bitrate, packets, log }}
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
