import { describe, expect, it } from "vitest";
import { buildFractalTunnelUniforms, normalizeFractalTunnelParams } from "../fractalTunnelEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.42,
  bass: 0.8,
  mid: 0.3,
  treble: 0.6,
  beat: true,
  beatStrength: 1.4
});

describe("fractal tunnel uniform mapping", () => {
  it("clamps quality and produces finite uniforms", () => {
    const params = normalizeFractalTunnelParams({
      quality: 9,
      warp: 2.5,
      hueShift: -1,
      exposure: 3.2,
      seed: 12
    });

    expect(params.quality).toBe(3);
    expect(params.warp).toBeLessThanOrEqual(2);
    expect(params.hueShift).toBeGreaterThanOrEqual(0);
    expect(params.exposure).toBeLessThanOrEqual(2);

    const uniforms = buildFractalTunnelUniforms(12.5, 320, 180, buildAudio(), params);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(48);
    expect(uniforms.steps).toBeLessThanOrEqual(112);
  });

  it("clamps quality to the minimum", () => {
    const params = normalizeFractalTunnelParams({ quality: -2, warp: 1.1, hueShift: 0.2, exposure: 1.1, seed: 4 });
    expect(params.quality).toBe(1);
  });
});
