import { describe, expect, it } from "vitest";
import { buildHeartCloudPoints } from "./heartCloudEffect";

describe("buildHeartCloudPoints", () => {
  it("creates a dense heart cloud", () => {
    const points = buildHeartCloudPoints(18);
    expect(points.length).toBeGreaterThan(500);
  });

  it("keeps points within the expected bounds with valid hues", () => {
    const points = buildHeartCloudPoints(18);
    points.forEach((point) => {
      expect(point.x).toBeGreaterThanOrEqual(-1.01);
      expect(point.x).toBeLessThanOrEqual(1.01);
      expect(point.y).toBeGreaterThanOrEqual(-1.01);
      expect(point.y).toBeLessThanOrEqual(1.01);
      expect(point.z).toBeGreaterThanOrEqual(-1.01);
      expect(point.z).toBeLessThanOrEqual(1.01);
      expect(point.hue).toBeGreaterThanOrEqual(240);
      expect(point.hue).toBeLessThanOrEqual(340);
    });
  });

  it("carves a visible cleft near the top center", () => {
    const points = buildHeartCloudPoints(18);
    const cleftPoints = points.filter((point) => point.y > 0.25 && Math.abs(point.x) < 0.12);
    expect(cleftPoints).toHaveLength(0);
  });
});
