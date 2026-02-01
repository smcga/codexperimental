import { describe, expect, it } from "vitest";
import { buildSpherePoints } from "./sphereEffect";

describe("buildSpherePoints", () => {
  it("creates a consistent vertex count", () => {
    const points = buildSpherePoints(6, 8);
    expect(points).toHaveLength((6 + 1) * 8);
  });

  it("generates points on the unit sphere", () => {
    const points = buildSpherePoints(8, 12);
    points.forEach((point) => {
      const magnitude = Math.hypot(point.x, point.y, point.z);
      expect(Math.abs(magnitude - 1)).toBeLessThan(1e-6);
    });
  });
});
