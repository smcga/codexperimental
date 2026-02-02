import { describe, expect, it } from "vitest";
import { buildHandCloudPoints, handCloudBounds } from "./handSdfCloudEffect";

describe("buildHandCloudPoints", () => {
  it("builds a deterministic point set", () => {
    const pointsA = buildHandCloudPoints();
    const pointsB = buildHandCloudPoints();

    expect(pointsA).toHaveLength(pointsB.length);
    expect(pointsA.length).toBeGreaterThan(1500);
    expect(pointsA.length).toBeLessThan(15000);
  });

  it("keeps points within bounds and normals normalized", () => {
    const points = buildHandCloudPoints();
    const { xMin, xMax, yMin, yMax, zMin, zMax } = handCloudBounds;

    points.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(xMin);
      expect(point.x).toBeLessThanOrEqual(xMax);
      expect(point.y).toBeGreaterThanOrEqual(yMin);
      expect(point.y).toBeLessThanOrEqual(yMax);
      expect(point.z).toBeGreaterThanOrEqual(zMin);
      expect(point.z).toBeLessThanOrEqual(zMax);
      const magnitude = Math.hypot(point.normal.x, point.normal.y, point.normal.z);
      expect(Math.abs(magnitude - 1)).toBeLessThan(1e-3);
    });
  });
});
