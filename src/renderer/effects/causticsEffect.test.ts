import { describe, expect, it } from "vitest";

import { CAUSTICS_DEFAULTS, resolveCausticsParams, sampleCausticsField } from "./causticsEffect";

describe("resolveCausticsParams", () => {
  it("clamps numeric params and keeps background type", () => {
    expect(
      resolveCausticsParams({
        scale: 99,
        speed: -4,
        intensity: 7,
        contrast: 0,
        warp: -1,
        detail: 9,
        background: 0.7,
        glow: -3,
        seed: 8,
        audioReactive: 99,
        driftX: 4,
        driftY: -4
      })
    ).toEqual({
      scale: 3,
      speed: 0,
      intensity: 3,
      contrast: 0.2,
      warp: 0,
      detail: 1.5,
      background: 0.7,
      color: "#8fd6ff",
      glow: 0,
      seed: 8,
      audioReactive: 1,
      driftX: 1,
      driftY: -1
    });
  });

  it("uses defaults for missing params", () => {
    expect(resolveCausticsParams({})).toEqual(CAUSTICS_DEFAULTS);
  });
});

describe("sampleCausticsField", () => {
  it("returns deterministic values for fixed seed and inputs", () => {
    const params = {
      scale: 1.12,
      contrast: 1.06,
      warp: 0.58,
      detail: 0.75,
      seed: 9
    };

    const a = sampleCausticsField(0.21, 0.37, 4.2, params);
    const b = sampleCausticsField(0.21, 0.37, 4.2, params);
    const c = sampleCausticsField(0.44, 0.81, 4.2, params);

    expect(a).toBeCloseTo(b, 10);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
    expect(c).not.toBeCloseTo(a, 4);
  });
});
