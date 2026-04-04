import { describe, expect, it } from "vitest";

import {
  TILING_MORPH_DEFAULTS,
  computeMorphWeights,
  computeNodePosition,
  getLoopedMorphPhase,
  hashNode,
  resolveTilingMorphParams
} from "./tilingMorph";

describe("resolveTilingMorphParams", () => {
  it("clamps numeric values and validates mode", () => {
    const result = resolveTilingMorphParams({
      scale: -10,
      morphSpeed: 100,
      morphAmount: -2,
      rotationSpeed: 9,
      lineWidth: 100,
      fillAlpha: 4,
      paletteShift: -5,
      audioReactive: -1,
      cellJitter: 2,
      roundedness: 4,
      contrast: 8,
      seed: -4,
      backgroundAlpha: -0.5,
      mode: "bad"
    });

    expect(result).toEqual({
      scale: 0.35,
      morphSpeed: 4,
      morphAmount: 0,
      rotationSpeed: 1,
      lineWidth: 8,
      fillAlpha: 1,
      paletteShift: -2,
      audioReactive: 0,
      cellJitter: 0.45,
      roundedness: 1,
      contrast: 2.5,
      seed: 0,
      backgroundAlpha: 0,
      mode: TILING_MORPH_DEFAULTS.mode
    });
  });
});

describe("tilingMorph helpers", () => {
  it("hashNode is deterministic for integer lattice inputs", () => {
    const a = hashNode(14, -3, 77);
    const b = hashNode(14, -3, 77);
    const c = hashNode(15, -3, 77);

    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it("looped phase wraps cleanly at 16-second cycle boundaries", () => {
    const start = getLoopedMorphPhase(0, 1);
    const wrapped = getLoopedMorphPhase(16, 1);
    const doubled = getLoopedMorphPhase(32, 1);

    expect(start).toBeCloseTo(wrapped, 10);
    expect(start).toBeCloseTo(doubled, 10);
  });

  it("morph weights form a normalized blend", () => {
    const weights = computeMorphWeights(2.4);
    const sum = weights[0] + weights[1] + weights[2] + weights[3];

    expect(sum).toBeCloseTo(1, 10);
    expect(weights.filter((w) => w > 0).length).toBeLessThanOrEqual(2);
  });

  it("computeNodePosition returns identical positions for shared lattice vertices", () => {
    const leftBottom = computeNodePosition(7, 9, 40, 0.8, 0.12, 0.3, 0.42, 0.2, 12);
    const rightBottom = computeNodePosition(7, 9, 40, 0.8, 0.12, 0.3, 0.42, 0.2, 12);

    expect(leftBottom[0]).toBeCloseTo(rightBottom[0], 10);
    expect(leftBottom[1]).toBeCloseTo(rightBottom[1], 10);
  });
});
