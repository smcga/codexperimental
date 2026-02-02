import { describe, expect, it } from "vitest";
import { buildLowpolySunriseUniforms, normalizeLowpolySunriseParams } from "../lowpolySunriseEffect";

const buildAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.5,
  bass: 0.7,
  mid: 0.2,
  treble: 0.4,
  beat: false,
  beatStrength: 0.6,
  impactStrength: 0
});

describe("lowpoly sunrise uniforms", () => {
  it("clamps parameters and builds finite uniforms", () => {
    const params = normalizeLowpolySunriseParams({ quality: 9, speed: 2.5, seed: 5 });
    expect(params.quality).toBe(3);
    expect(params.speed).toBeLessThanOrEqual(1.2);

    const uniforms = buildLowpolySunriseUniforms(12, 320, 180, buildAudio(), params, 0.6, 0.3);
    expect(uniforms.sunPos).toBeDefined();
    expect(uniforms.sunDir).toBeDefined();
    expect(uniforms.fogAmount).toBeDefined();
    expect(uniforms.cloudOffset).toBeDefined();

    Object.values(uniforms).forEach((value) => {
      if (typeof value === "number") {
        expect(Number.isFinite(value)).toBe(true);
      }
    });
  });
});
