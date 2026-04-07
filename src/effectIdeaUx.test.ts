import { describe, expect, it } from "vitest";
import {
  EFFECT_IDEA_NAME_MAX_LENGTH,
  getCountdownBeatDurationMs,
  sanitizeEffectIdeaName,
  shuffleEffectIds
} from "./effectIdeaUx";

describe("effect idea ux helpers", () => {
  it("calculates countdown beat timing from BPM", () => {
    expect(getCountdownBeatDurationMs(177)).toBeCloseTo(338.98, 2);
  });

  it("shuffles ids with deterministic random source", () => {
    const values = [0.9, 0.1, 0.6];
    let cursor = 0;
    const random = () => {
      const value = values[cursor] ?? 0;
      cursor += 1;
      return value;
    };
    expect(shuffleEffectIds(["a", "b", "c", "d"], random)).toEqual(["c", "b", "a", "d"]);
  });

  it("sanitizes user-entered effect names", () => {
    const raw = "  \nNeon@Tunnel<> Bloom!!!  ";
    expect(sanitizeEffectIdeaName(raw)).toBe("NeonTunnel Bloom");
  });

  it("trims names to the maximum supported length", () => {
    const longName = "x".repeat(EFFECT_IDEA_NAME_MAX_LENGTH + 12);
    expect(sanitizeEffectIdeaName(longName)).toHaveLength(EFFECT_IDEA_NAME_MAX_LENGTH);
  });
});
