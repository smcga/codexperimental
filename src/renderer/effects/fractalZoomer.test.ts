import { describe, expect, it } from "vitest";

import {
  buildFractalZoomerState,
  normalizeFractalZoomerParams
} from "./fractalZoomer";

const audio = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.4,
  bass: 0.8,
  mid: 0.2,
  treble: 0.1,
  beat: true,
  beatStrength: 0.5,
  impactStrength: 0
};

describe("fractalZoomer params", () => {
  it("normalizes params with defaults and clamps", () => {
    const params = normalizeFractalZoomerParams({
      setType: "invalid",
      zoom: 99,
      centerX: -12,
      centerY: 9,
      iterations: 10000,
      paletteSpeed: -1,
      audioReact: 2
    });

    expect(params.setType).toBe("mandelbrot");
    expect(params.zoom).toBe(8);
    expect(params.centerX).toBe(-2.5);
    expect(params.centerY).toBe(1.8);
    expect(params.iterations).toBe(600);
    expect(params.paletteSpeed).toBe(0);
    expect(params.audioReact).toBe(1);
  });

  it("maps normalized params to deterministic state", () => {
    const params = normalizeFractalZoomerParams({
      setType: "julia",
      zoom: 2,
      centerX: -0.2,
      centerY: 0.3,
      iterations: 120,
      paletteSpeed: 0.4,
      audioReact: 0.75
    });

    const first = buildFractalZoomerState(10, audio, params);
    const second = buildFractalZoomerState(10, audio, params);

    expect(first).toEqual(second);
    expect(first.setType).toBe("julia");
    expect(first.zoomScale).toBeGreaterThan(4);
    expect(first.iterations).toBeGreaterThanOrEqual(120);
    expect(first.palettePhase).toBeGreaterThan(4);
  });
});
