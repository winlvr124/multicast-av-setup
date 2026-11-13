import { describe, expect, it } from "vitest";
import {
  DEFAULT_ENCODER_CONTENT,
  DEFAULT_STREAMING,
  DEFAULT_SUBSCRIPTIONS,
  ROUTING_PRESETS,
  canSelectContent,
  displayedContent,
  getDisplayState,
  receivingDecoders,
  type DecoderId,
} from "@/lib/av-sim";

const allOnline = { dec1: "online", dec2: "online", dec3: "online" } as const;
const content = { enc1: "welcome", enc2: "programme" };
const ids: DecoderId[] = ["dec1", "dec2", "dec3"];
const bothLive = { enc1: true, enc2: true };

describe("AV-over-IP multicast simulation rules", () => {
  it("default demo: ENC-01 feeds Canning and Collyer, ENC-02 feeds Padang", () => {
    expect(DEFAULT_SUBSCRIPTIONS).toEqual({ dec1: "enc1", dec2: "enc2", dec3: "enc1" });
    expect(DEFAULT_STREAMING).toEqual({ enc1: true, enc2: true });
    expect(DEFAULT_ENCODER_CONTENT.enc1).not.toBe(DEFAULT_ENCODER_CONTENT.enc2);
  });

  it("default demo shows two identical outputs and one different output", () => {
    const shown = ids.map((id) =>
      displayedContent(DEFAULT_STREAMING, allOnline[id], DEFAULT_SUBSCRIPTIONS[id], DEFAULT_ENCODER_CONTENT),
    );
    expect(shown[0]).toBe(shown[2]);
    expect(shown[1]).not.toBe(shown[0]);
    expect(shown[1]).toBe(DEFAULT_ENCODER_CONTENT.enc2);
  });

  it("all-on-ENC-01 preset sends the same multicast stream to all three decoders", () => {
    const subs = ROUTING_PRESETS.allEnc1;
    expect(receivingDecoders(bothLive, allOnline, subs, "enc1")).toEqual(["dec1", "dec2", "dec3"]);
    const shown = ids.map((id) => displayedContent(bothLive, allOnline[id], subs[id], content));
    expect(shown).toEqual(["welcome", "welcome", "welcome"]);
  });

  it("stopping ENC-02 blanks only Padang; ENC-01 rooms keep receiving", () => {
    const streaming = { enc1: true, enc2: false };
    expect(receivingDecoders(streaming, allOnline, DEFAULT_SUBSCRIPTIONS)).toEqual(["dec1", "dec3"]);
  });

  it("stopping ENC-01 blanks Canning and Collyer together", () => {
    const streaming = { enc1: false, enc2: true };
    expect(receivingDecoders(streaming, allOnline, DEFAULT_SUBSCRIPTIONS)).toEqual(["dec2"]);
    expect(getDisplayState(false, "online")).toBe("idle");
  });

  it("a disconnected decoder shows no signal while the others keep receiving", () => {
    const statuses = { ...allOnline, dec3: "offline" } as const;
    expect(getDisplayState(true, "offline")).toBe("no-signal");
    expect(receivingDecoders(bothLive, statuses, DEFAULT_SUBSCRIPTIONS)).toEqual(["dec1", "dec2"]);
  });

  it("a reconnecting decoder does not show content until it is back online", () => {
    expect(getDisplayState(true, "connecting")).toBe("connecting");
    expect(displayedContent(bothLive, "connecting", "enc1", content)).toBeNull();
  });

  it("Source A and Source B cannot play the same slide", () => {
    expect(canSelectContent("enc2", "welcome", content)).toBe(false);
    expect(canSelectContent("enc2", "showcase", content)).toBe(true);
    expect(canSelectContent("enc1", "welcome", content)).toBe(true);
  });
});
