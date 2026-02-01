import { describe, expect, it } from "vitest";

import { clampExposure, clampQuality, resolveImpossibleCorridorUniforms } from "../impossibleCorridorEffect";
import { AudioFeatures } from "../../../audio/audioPlayer";

const baseAudio: AudioFeatures = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.2,
  bass: 0.3,
  mid: 0.4,
  treble: 0.5,
  beat: true,
  beatStrength: 0.9
};

describe("impossible corridor params", () => {
  it("clamps quality to 1..3", () => {
    expect(clampQuality(0)).toBe(1);
    expect(clampQuality(4)).toBe(3);
    expect(clampQuality(2.4)).toBe(2);
  });

  it("clamps exposure to 0.5..2", () => {
    expect(clampExposure(0.1)).toBe(0.5);
    expect(clampExposure(2.8)).toBe(2);
    expect(clampExposure(1.4)).toBe(1.4);
  });

  it("ensures uniforms are finite", () => {
    const resolved = resolveImpossibleCorridorUniforms(1920, 1080, 1.2, baseAudio, { quality: 2 }, 0.8);
    const { uniforms } = resolved;
    const values = [
      uniforms.time,
      uniforms.resolution[0],
      uniforms.resolution[1],
      uniforms.audio.rms,
      uniforms.audio.bass,
      uniforms.audio.mid,
      uniforms.audio.treble,
      uniforms.audio.beat,
      uniforms.audio.beatStrength,
      uniforms.params.warp,
      uniforms.params.hueShift,
      uniforms.params.exposure,
      uniforms.params.seed,
      uniforms.params.quality,
      uniforms.params.aspect
    ];

    values.forEach((value) => {
      expect(Number.isFinite(value)).toBe(true);
    });
  });
});
