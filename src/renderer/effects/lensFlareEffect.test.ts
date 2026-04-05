import { describe, expect, it } from "vitest";
import {
  computeLensFlareGhostScalar,
  LENS_FLARE_DEFAULTS,
  resolveLensFlareParams,
  resolveLensFlareSource
} from "./lensFlareEffect";

describe("lens flare helpers", () => {
  it("resolves defaults and clamps ranges", () => {
    const resolved = resolveLensFlareParams({
      ghostCount: 99,
      chromatic: -10,
      intensity: 9,
      sourceX: 3,
      sourceY: -2
    });

    expect(resolved.ghostCount).toBe(12);
    expect(resolved.chromatic).toBe(0);
    expect(resolved.intensity).toBe(4);
    expect(resolved.sourceX).toBe(1);
    expect(resolved.sourceY).toBe(0);
    expect(resolved.haloRadius).toBe(LENS_FLARE_DEFAULTS.haloRadius);
  });

  it("prefers explicit normalized source coordinates", () => {
    const source = resolveLensFlareSource(320, 180, 12, 0.2, 0.9, 0.8, 0.25, 0.75);
    expect(source.nx).toBe(0.25);
    expect(source.ny).toBe(0.75);
    expect(source.x).toBe(80);
    expect(source.y).toBe(135);
  });

  it("builds deterministic procedural source positions", () => {
    const a = resolveLensFlareSource(640, 360, 25, 0.6, 0.4, 0.7);
    const b = resolveLensFlareSource(640, 360, 25, 0.6, 0.4, 0.7);
    expect(a).toEqual(b);
    expect(a.nx).toBeGreaterThanOrEqual(-0.15);
    expect(a.nx).toBeLessThanOrEqual(1.15);
    expect(a.ny).toBeGreaterThanOrEqual(-0.15);
    expect(a.ny).toBeLessThanOrEqual(1.15);
  });

  it("places ghost scalars in axis order", () => {
    const values = Array.from({ length: 6 }, (_, i) => computeLensFlareGhostScalar(i, 6, 1.2));
    expect(values[0]).toBeLessThan(0);
    expect(values[values.length - 1]).toBeGreaterThan(2);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
