import { describe, expect, it } from "vitest";

import {
  buildRaymarchFractalUniforms,
  normalizeRaymarchFractalParams
} from "./raymarchFractal";

const audio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.2,
  bass: 0.9,
  mid: 0.1,
  treble: 0.05,
  beat: true,
  beatStrength: 0.4,
  impactStrength: 0
};

describe("raymarchFractal params", () => {
  it("normalizes params with clamps and defaults", () => {
    const params = normalizeRaymarchFractalParams({
      quality: 2.0,
      fractal: "mandelbox",
      cameraRadius: 20,
      cameraHeight: -5,
      cameraOrbitSpeed: 2,
      paletteSpeed: -1,
      audioReact: 2,
      beatKick: -1,
      fractalScale: 4
    });

    expect(params.quality).toBe(1.5);
    expect(params.fractal).toBe("mandelbox");
    expect(params.cameraRadius).toBe(8);
    expect(params.cameraHeight).toBe(-2);
    expect(params.cameraOrbitSpeed).toBe(1);
    expect(params.paletteSpeed).toBe(0);
    expect(params.audioReact).toBe(1);
    expect(params.beatKick).toBe(0);
    expect(params.fractalScale).toBe(2.2);
  });

  it("builds uniforms with audio mapping", () => {
    const params = normalizeRaymarchFractalParams({ fractal: "mandelbox", quality: 1.0 });
    const uniforms = buildRaymarchFractalUniforms(12, 640, 480, audio, params);

    expect(uniforms.time).toBe(12);
    expect(uniforms.resolution).toEqual([640, 480]);
    expect(uniforms.bass).toBe(0.9);
    expect(uniforms.beat).toBe(1);
    expect(uniforms.mode).toBe(1);
    expect(uniforms.steps).toBeGreaterThan(0);
  });
});
