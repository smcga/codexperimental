import { describe, expect, it } from "vitest";

import { getSkyboxPhase, getSkyboxPhaseWeights, interpolateSkyboxPalette } from "./skyboxTransition";

describe("skyboxTransition helpers", () => {
  it("wraps phase when loop is enabled", () => {
    const phase = getSkyboxPhase(120, 1, true, 0.1);
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(1);
  });

  it("clamps phase when loop is disabled", () => {
    const phase = getSkyboxPhase(120, 1, false, 0);
    expect(phase).toBe(1);
  });

  it("normalizes phase weights", () => {
    const weights = getSkyboxPhaseWeights(0.42);
    const sum = weights.reduce((acc, value) => acc + value, 0);

    expect(sum).toBeCloseTo(1, 5);
    weights.forEach((weight) => {
      expect(weight).toBeGreaterThanOrEqual(0);
      expect(weight).toBeLessThanOrEqual(1);
    });
  });

  it("interpolates deterministic palette values", () => {
    const paletteA = interpolateSkyboxPalette(0.73);
    const paletteB = interpolateSkyboxPalette(0.73);

    expect(paletteA).toEqual(paletteB);
    expect(paletteA.zenith[0]).toBeGreaterThan(0);
  });
});
