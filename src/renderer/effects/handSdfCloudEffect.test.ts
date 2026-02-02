import { describe, expect, it } from "vitest";
import { buildHandCloudPoints } from "./handSdfCloudEffect";

const withinRange = (value: number, min: number, max: number): boolean => value >= min && value <= max;

describe("buildHandCloudPoints", () => {
  it("is deterministic across calls", () => {
    const first = buildHandCloudPoints();
    const second = buildHandCloudPoints();
    expect(first).toHaveLength(second.length);
    expect(first[0]).toEqual(second[0]);
  });

  it("keeps points within expected bounds", () => {
    const points = buildHandCloudPoints();
    points.forEach((point) => {
      expect(withinRange(point.x, -1.9, 1.3)).toBe(true);
      expect(withinRange(point.y, -1.0, 2.3)).toBe(true);
      expect(withinRange(point.z, -1.0, 1.0)).toBe(true);
    });
  });

  it("produces normals close to unit length", () => {
    const points = buildHandCloudPoints();
    points.slice(0, 50).forEach((point) => {
      const magnitude = Math.hypot(point.normal.x, point.normal.y, point.normal.z);
      expect(Math.abs(magnitude - 1)).toBeLessThan(0.05);
    });
  });
});
