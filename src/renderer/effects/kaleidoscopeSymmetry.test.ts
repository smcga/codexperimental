import { describe, expect, it } from "vitest";

import {
  clampKaleidoscopeSlices,
  foldAngleToWedge,
  KALEIDOSCOPE_SYMMETRY_DEFAULTS,
  resolveKaleidoscopeParams
} from "./kaleidoscopeSymmetry";

describe("kaleidoscope symmetry helpers", () => {
  it("clamps and rounds slice counts", () => {
    expect(clampKaleidoscopeSlices(2.4)).toBe(3);
    expect(clampKaleidoscopeSlices(7.6)).toBe(8);
    expect(clampKaleidoscopeSlices(36)).toBe(24);
  });

  it("folds angles into mirrored wedge space", () => {
    const wedge = Math.PI / 4;
    const foldedA = foldAngleToWedge(Math.PI * 0.1, wedge);
    const foldedB = foldAngleToWedge(Math.PI * 0.9, wedge);
    expect(foldedA).toBeGreaterThanOrEqual(0);
    expect(foldedA).toBeLessThanOrEqual(wedge);
    expect(foldedB).toBeGreaterThanOrEqual(0);
    expect(foldedB).toBeLessThanOrEqual(wedge);
    expect(foldAngleToWedge(Math.PI / 8, wedge)).toBeCloseTo(foldAngleToWedge((Math.PI * 7) / 8, wedge));
  });

  it("applies defaults and normalization with era bias", () => {
    const resolved = resolveKaleidoscopeParams({ slices: 1, centreX: -4, centreY: 3, ringDensity: 2.5 }, "future");
    expect(resolved.slices).toBe(3);
    expect(resolved.centreX).toBe(0);
    expect(resolved.centreY).toBe(1);
    expect(resolved.ringDensity).toBeLessThanOrEqual(1.8);

    const defaultResolved = resolveKaleidoscopeParams({}, "16bit");
    expect(defaultResolved.rotationSpeed).toBe(KALEIDOSCOPE_SYMMETRY_DEFAULTS.rotationSpeed);
    expect(defaultResolved.mirror).toBe(KALEIDOSCOPE_SYMMETRY_DEFAULTS.mirror);
  });
});
