import { describe, expect, it } from "vitest";
import { buildSphereCloudPoints } from "./sphereCloudEffect";

describe("buildSphereCloudPoints", () => {
  it("creates the expected vertex count", () => {
    const points = buildSphereCloudPoints(6, 8);
    expect(points).toHaveLength((6 + 1) * 8);
  });

  it("generates unit sphere points with valid hues", () => {
    const points = buildSphereCloudPoints(8, 12);
    points.forEach((point) => {
      const magnitude = Math.hypot(point.x, point.y, point.z);
      expect(Math.abs(magnitude - 1)).toBeLessThan(1e-6);
      expect(point.hue).toBeGreaterThanOrEqual(190);
      expect(point.hue).toBeLessThanOrEqual(330);
    });
  });
});
