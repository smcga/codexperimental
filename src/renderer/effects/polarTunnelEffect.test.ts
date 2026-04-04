import { describe, expect, it } from "vitest";

import {
  POLAR_TUNNEL_DEFAULTS,
  resolvePolarTunnelParams,
  samplePolarTunnelRgb
} from "./polarTunnelEffect";

describe("resolvePolarTunnelParams", () => {
  it("clamps parameter values and uses defaults for invalid input", () => {
    const resolved = resolvePolarTunnelParams({
      rotateSpeed: 99,
      wobbleFrequency: -4,
      wobbleSpeed: -20,
      wobbleAmount: 10,
      radialWobbleFrequency: 200,
      radialWobbleSpeed: 99,
      radialWobbleAmount: -2,
      radialFrequency: 0,
      angularFrequency: 99,
      colorCycles: 0,
      audioReact: 9
    });

    expect(resolved).toEqual({
      rotateSpeed: 4,
      wobbleFrequency: 0,
      wobbleSpeed: -8,
      wobbleAmount: 2,
      radialWobbleFrequency: 24,
      radialWobbleSpeed: 8,
      radialWobbleAmount: 0,
      radialFrequency: 1,
      angularFrequency: 24,
      colorCycles: 0.5,
      audioReact: 1
    });
  });

  it("returns defaults when params are omitted", () => {
    expect(resolvePolarTunnelParams({})).toEqual(POLAR_TUNNEL_DEFAULTS);
  });
});

describe("samplePolarTunnelRgb", () => {
  it("returns deterministic RGB values in range for a fixed sample", () => {
    const params = resolvePolarTunnelParams({});
    const first = samplePolarTunnelRgb({ u: 0.12, v: -0.27, time: 1.5, rms: 0.35, bass: 0.42, params });
    const second = samplePolarTunnelRgb({ u: 0.12, v: -0.27, time: 1.5, rms: 0.35, bass: 0.42, params });

    expect(first).toEqual(second);
    first.forEach((channel) => {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    });
  });

  it("handles the center singularity without non-finite output", () => {
    const params = resolvePolarTunnelParams({});
    const color = samplePolarTunnelRgb({ u: 0, v: 0, time: 0.25, rms: 0, bass: 0, params });

    color.forEach((channel) => {
      expect(Number.isFinite(channel)).toBe(true);
    });
  });
});
