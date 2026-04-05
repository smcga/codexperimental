import { describe, expect, it } from "vitest";
import {
  createMulberry32,
  createSeededFields,
  normalizeReactionDiffusionParams,
  REACTION_DIFFUSION_DEFAULTS
} from "./reactionDiffusion";

describe("reactionDiffusion helpers", () => {
  it("creates deterministic PRNG sequences", () => {
    const a = createMulberry32(42);
    const b = createMulberry32(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("normalizes and clamps effect params", () => {
    const normalized = normalizeReactionDiffusionParams(
      {
        scale: 100,
        simScale: 0.001,
        steps: 99,
        invert: 1,
        feed: -1,
        kill: 1
      },
      "8bit"
    );

    expect(normalized.scale).toBe(3);
    expect(normalized.simScale).toBeGreaterThanOrEqual(0.08);
    expect(normalized.steps).toBeLessThanOrEqual(12);
    expect(normalized.feed).toBeGreaterThanOrEqual(0.01);
    expect(normalized.kill).toBeLessThanOrEqual(0.09);
    expect(normalized.invert).toBe(true);
  });

  it("seeds the same initial fields for identical seed + size", () => {
    const first = createSeededFields(64, 48, 1234);
    const second = createSeededFields(64, 48, 1234);

    expect(Array.from(first.fieldA)).toEqual(Array.from(second.fieldA));
    expect(Array.from(first.fieldB)).toEqual(Array.from(second.fieldB));
    expect(first.fieldB.some((v) => v > 0)).toBe(true);
    expect(first.fieldA.some((v) => v < REACTION_DIFFUSION_DEFAULTS.diffA)).toBe(true);
  });
});
