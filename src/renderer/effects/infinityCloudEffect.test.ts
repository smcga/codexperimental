import { describe, expect, it } from "vitest";
import { buildInfinityCloudPoints } from "./infinityCloudEffect";

describe("buildInfinityCloudPoints", () => {
  it("creates a dense loop of points", () => {
    const points = buildInfinityCloudPoints(24, 10);
    expect(points).toHaveLength(240);
    points.forEach((point) => {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(Number.isFinite(point.z)).toBe(true);
      expect(point.hue).toBeGreaterThanOrEqual(200);
      expect(point.hue).toBeLessThanOrEqual(350);
    });
  });
});
