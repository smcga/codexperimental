import { describe, expect, it } from "vitest";
import { buildSpaceHangarUniforms, normalizeSpaceHangarParams } from "../spaceHangarEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.7,
  bass: 0.8,
  mid: 0.4,
  treble: 0.5,
  beat: false,
  beatStrength: 1.2,
  impactStrength: 0
});

describe("space hangar uniforms", () => {
  it("clamps params and builds finite uniforms", () => {
    const params = normalizeSpaceHangarParams({
      quality: 4,
      speed: 4,
      exposure: 3,
      seed: 11
    });

    expect(params.quality).toBe(3);
    expect(params.speed).toBeLessThanOrEqual(2);
    expect(params.exposure).toBeLessThanOrEqual(1.8);

    const uniforms = buildSpaceHangarUniforms(3.2, 800, 450, buildAudio(), params, 0.5, 0.6, [0.1, -0.1], 1.2);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.camOffset).toEqual([0.1, -0.1]);
    expect(uniforms.speed).toBe(1.2);
  });

  it("clamps quality to minimum", () => {
    const params = normalizeSpaceHangarParams({ quality: -2, speed: 0.4, exposure: 1, seed: 4 });
    expect(params.quality).toBe(1);
  });
});
