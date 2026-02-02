import { describe, expect, it } from "vitest";
import { buildNeonAlleyUniforms, normalizeNeonAlleyParams } from "../neonAlleyEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.25,
  bass: 0.9,
  mid: 0.35,
  treble: 0.6,
  beat: false,
  beatStrength: 1.2,
  impactStrength: 0
});

describe("neon alley uniforms", () => {
  it("clamps params and produces finite uniforms", () => {
    const params = normalizeNeonAlleyParams({
      quality: 9,
      speed: 2.2,
      exposure: 4.0,
      seed: 17
    });

    expect(params.quality).toBe(3);
    expect(params.speed).toBeLessThanOrEqual(1.6);
    expect(params.exposure).toBeLessThanOrEqual(1.6);

    const uniforms = buildNeonAlleyUniforms(4.2, 320, 180, buildAudio(), params);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(32);
  });

  it("floors quality to the minimum", () => {
    const params = normalizeNeonAlleyParams({ quality: -1, speed: 0.6, exposure: 1.05, seed: 4 });
    expect(params.quality).toBe(1);
  });
});
