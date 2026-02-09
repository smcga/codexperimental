import { describe, expect, it } from "vitest";
import {
  TEMPORAL_PARALLAX_INVERSION_DEFAULTS,
  computeFoldModulation,
  depthToDeltaT,
  getTpiPalette,
} from "./temporalParallaxInversion";

describe("depthToDeltaT", () => {
  it("clamps depth and produces near lead + far lag", () => {
    const params = {
      timeScale: 1.2,
      depthGamma: 1,
      allowLead: 1,
      foldAmount: 0,
      foldFreq: 1,
      foldSpeed: 1,
    } as const;

    const near = depthToDeltaT(-2, params, 0);
    const mid = depthToDeltaT(0.5, params, 0);
    const far = depthToDeltaT(2, params, 0);

    expect(near).toBeCloseTo(0);
    expect(mid).toBeCloseTo(0);
    expect(far).toBeCloseTo(1.2);
  });

  it("supports lag-only mapping when allowLead is disabled", () => {
    const lagOnly = depthToDeltaT(0.5, {
      ...TEMPORAL_PARALLAX_INVERSION_DEFAULTS,
      allowLead: 0,
    }, 1.5);

    expect(lagOnly).toBeGreaterThan(0);
  });
});

describe("computeFoldModulation", () => {
  it("stays bounded by fold amount", () => {
    const foldAmount = 0.35;
    for (let i = 0; i < 64; i += 1) {
      const v = computeFoldModulation(i / 63, i * 0.1, 1.8, 0.35, foldAmount);
      expect(v).toBeLessThanOrEqual(foldAmount);
      expect(v).toBeGreaterThanOrEqual(-foldAmount);
    }
  });
});

describe("getTpiPalette", () => {
  it("returns valid RGB triplets for palette variants", () => {
    for (let i = 0; i < 6; i += 1) {
      const palette = getTpiPalette(i);
      const entries = [
        palette.backgroundTop,
        palette.backgroundBottom,
        palette.rim,
        palette.fog,
        palette.sphereA,
        palette.sphereB,
      ];
      entries.forEach((triplet) => {
        expect(triplet).toHaveLength(3);
        triplet.forEach((channel) => {
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        });
      });
    }
  });
});
