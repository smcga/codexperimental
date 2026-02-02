import { describe, expect, it } from "vitest";
import { buildImpossibleCorridorUniforms, normalizeImpossibleCorridorParams } from "../impossibleCorridorEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.42,
  bass: 0.9,
  mid: 0.2,
  treble: 0.7,
  beat: true,
  beatStrength: 1.5,
  impactStrength: 0
});

describe("impossible corridor params", () => {
  it("clamps quality and exposure values", () => {
    const params = normalizeImpossibleCorridorParams({
      quality: 9,
      warp: 2.5,
      hueShift: -1,
      exposure: 3.6,
      seed: 12,
      speed: 3,
      internalScale: 4
    });

    expect(params.quality).toBe(3);
    expect(params.exposure).toBeLessThanOrEqual(2);
    expect(params.warp).toBeLessThanOrEqual(2);
    expect(params.hueShift).toBeGreaterThanOrEqual(0);
  });

  it("clamps quality to the minimum", () => {
    const params = normalizeImpossibleCorridorParams({
      quality: -2,
      warp: 1.1,
      hueShift: 0.2,
      exposure: 1.1,
      seed: 4,
      speed: 0.6
    });

    expect(params.quality).toBe(1);
  });

  it("builds finite uniforms", () => {
    const params = normalizeImpossibleCorridorParams({
      quality: 2,
      warp: 1.2,
      hueShift: 0.15,
      exposure: 1.1,
      seed: 7,
      speed: 0.6
    });
    const uniforms = buildImpossibleCorridorUniforms(12.5, 320, 180, buildAudio(), params, 0.8);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(56);
    expect(uniforms.steps).toBeLessThanOrEqual(120);
  });
});
