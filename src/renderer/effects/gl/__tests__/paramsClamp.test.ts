import { describe, expect, it } from "vitest";
import {
  buildImpossibleCorridorUniforms,
  normalizeImpossibleCorridorParams
} from "../impossibleCorridorEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.8,
  bass: 1.1,
  mid: 0.4,
  treble: 0.9,
  beat: true,
  beatStrength: 2.2
});

describe("impossible corridor params", () => {
  it("clamps quality and exposure ranges", () => {
    const params = normalizeImpossibleCorridorParams({
      quality: 9,
      warp: 3,
      hueShift: -1,
      exposure: 3.2,
      seed: 12,
      speed: 3
    });

    expect(params.quality).toBe(3);
    expect(params.exposure).toBeLessThanOrEqual(2);
    expect(params.exposure).toBeGreaterThanOrEqual(0.5);
  });

  it("produces finite uniform values", () => {
    const params = normalizeImpossibleCorridorParams({
      quality: 1,
      warp: 1.2,
      hueShift: 0.2,
      exposure: 1.1,
      seed: 9,
      speed: 0.7
    });

    const uniforms = buildImpossibleCorridorUniforms(12.5, 320, 180, buildAudio(), params, 0.9);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(56);
    expect(uniforms.steps).toBeLessThanOrEqual(120);
  });
});
