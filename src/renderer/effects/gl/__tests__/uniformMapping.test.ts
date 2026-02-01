import { describe, expect, it } from "vitest";

import { AudioFeatures } from "../../../../audio/audioPlayer";
import { buildFractalTunnelUniforms, coerceFractalTunnelParams } from "../fractalTunnelEffect";

describe("fractal tunnel uniforms", () => {
  it("maps audio features and params to finite uniforms", () => {
    const audio: AudioFeatures = {
      timeDomain: new Uint8Array(4),
      frequency: new Uint8Array(4),
      rms: 0.6,
      bass: 1.2,
      mid: 0.4,
      treble: 0.9,
      beat: true,
      beatStrength: 1.4
    };
    const params = coerceFractalTunnelParams({
      quality: 2,
      warp: 1.5,
      hueShift: 0.2,
      exposure: 1.8,
      seed: 12
    });
    const uniforms = buildFractalTunnelUniforms(12.5, 320, 180, audio, params);
    const values = [
      uniforms.time,
      uniforms.resolution[0],
      uniforms.resolution[1],
      uniforms.rms,
      uniforms.bass,
      uniforms.mid,
      uniforms.treble,
      uniforms.beat,
      uniforms.beatStrength,
      uniforms.quality,
      uniforms.warp,
      uniforms.hueShift,
      uniforms.exposure,
      uniforms.seed
    ];
    values.forEach((value) => {
      expect(Number.isFinite(value)).toBe(true);
    });
    expect(uniforms.rms).toBeGreaterThanOrEqual(0);
    expect(uniforms.rms).toBeLessThanOrEqual(1);
    expect(uniforms.bass).toBeLessThanOrEqual(1);
    expect(uniforms.beat).toBe(1);
    expect(uniforms.beatStrength).toBeLessThanOrEqual(1);
  });

  it("clamps quality to the supported range", () => {
    expect(coerceFractalTunnelParams({ quality: -2 }).quality).toBe(1);
    expect(coerceFractalTunnelParams({ quality: 4 }).quality).toBe(3);
  });
});
