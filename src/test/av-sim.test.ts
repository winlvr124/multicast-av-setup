import { describe, expect, it } from "vitest";
import { displayedContent, getDisplayState, receivingDecoders } from "@/lib/av-sim";

const allOnline = { dec1: "online", dec2: "online", dec3: "online" } as const;

describe("AV-over-IP multicast simulation rules", () => {
  it("streaming delivers the same content to all three online decoders", () => {
    expect(receivingDecoders(true, allOnline)).toEqual(["dec1", "dec2", "dec3"]);
    const shown = (["dec1", "dec2", "dec3"] as const).map((id) =>
      displayedContent(true, allOnline[id], "welcome"),
    );
    expect(shown).toEqual(["welcome", "welcome", "welcome"]);
  });

  it("stopping the stream blanks every display", () => {
    expect(receivingDecoders(false, allOnline)).toEqual([]);
    expect(getDisplayState(false, "online")).toBe("idle");
  });

  it("a disconnected decoder shows no signal while the others keep receiving", () => {
    const statuses = { ...allOnline, dec2: "offline" } as const;
    expect(getDisplayState(true, "offline")).toBe("no-signal");
    expect(receivingDecoders(true, statuses)).toEqual(["dec1", "dec3"]);
  });

  it("a reconnecting decoder does not show content until it is back online", () => {
    expect(getDisplayState(true, "connecting")).toBe("connecting");
    expect(displayedContent(true, "connecting", "welcome")).toBeNull();
  });
});
