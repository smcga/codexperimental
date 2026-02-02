import { describe, expect, it } from "vitest";
import { buildNeonAlleyUniforms, normalizeNeonAlleyParams } from "../neonAlleyEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.6,
  bass: 0.9,
  mid: 0.4,
  treble: 0.8,
  beat: false,
  beatStrength: 1.1,
  impactStrength: 0
});

describe("neon alley uniforms", () => {
  it("clamps params and outputs finite uniforms", () => {
    const params = normalizeNeonAlleyParams({
      quality: 5,
      speed: 3.4,
      exposure: 4.2,
      hueShift: -2,
      seed: 9
    });

    expect(params.quality).toBe(3);
    expect(params.speed).toBeLessThanOrEqual(1.6);
    expect(params.exposure).toBeLessThanOrEqual(2);
    expect(params.hueShift).toBeGreaterThanOrEqual(0);

    const uniforms = buildNeonAlleyUniforms(4.2, 640, 360, buildAudio(), params);
    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
    expect(uniforms.steps).toBeGreaterThanOrEqual(48);
    expect(uniforms.steps).toBeLessThanOrEqual(96);
  });

  it("clamps quality to minimum", () => {
    const params = normalizeNeonAlleyParams({ quality: -3, speed: 0.4, exposure: 0.9, hueShift: 0.2, seed: 3 });
    expect(params.quality).toBe(1);
  });
});
