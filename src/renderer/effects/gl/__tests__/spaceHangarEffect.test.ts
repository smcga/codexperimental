import { describe, expect, it } from "vitest";
import { buildSpaceHangarUniforms, normalizeSpaceHangarParams } from "../spaceHangarEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.55,
  bass: 0.92,
  mid: 0.35,
  treble: 0.7,
  beat: true,
  beatStrength: 1.2,
  impactStrength: 0
});

describe("space hangar uniforms", () => {
  it("clamps params and outputs finite uniforms", () => {
    const params = normalizeSpaceHangarParams({
      quality: 6,
      speed: 3.2,
      exposure: 4.1,
      hueShift: -1,
      seed: 8
    });

    expect(params.quality).toBe(3);
    expect(params.speed).toBeLessThanOrEqual(2);
    expect(params.exposure).toBeLessThanOrEqual(2);
    expect(params.hueShift).toBeGreaterThanOrEqual(0);

    const uniforms = buildSpaceHangarUniforms(3.4, 640, 360, buildAudio(), params, {
      bass: 0.8,
      rms: 0.4,
      beatStrength: 0.6,
      camOffset: [0.01, -0.02],
      speed: 1.1
    });

    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.speed).toBeCloseTo(1.1);
    expect(uniforms.camOffset).toEqual([0.01, -0.02]);
  });

  it("clamps quality to minimum", () => {
    const params = normalizeSpaceHangarParams({ quality: -3, speed: 0.4, exposure: 0.9, hueShift: 0.2, seed: 3 });
    expect(params.quality).toBe(1);
  });
});
