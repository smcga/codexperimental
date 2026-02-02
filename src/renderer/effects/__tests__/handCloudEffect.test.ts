import { describe, expect, it } from "vitest";
import { buildHandCloudPoints } from "../handCloudEffect";

const magnitude = (x: number, y: number, z: number): number => Math.hypot(x, y, z);

describe("hand cloud effect", () => {
  it("builds a stable number of points", () => {
    const points = buildHandCloudPoints();

    expect(points.length).toBeGreaterThan(2000);
  });

  it("keeps points within reasonable bounds", () => {
    const points = buildHandCloudPoints();
    const bounds = points.reduce(
      (acc, point) => {
        acc.minX = Math.min(acc.minX, point.x);
        acc.maxX = Math.max(acc.maxX, point.x);
        acc.minY = Math.min(acc.minY, point.y);
        acc.maxY = Math.max(acc.maxY, point.y);
        acc.minZ = Math.min(acc.minZ, point.z);
        acc.maxZ = Math.max(acc.maxZ, point.z);
        return acc;
      },
      {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity
      }
    );

    expect(Math.abs(bounds.minX)).toBeLessThan(4);
    expect(Math.abs(bounds.maxX)).toBeLessThan(4);
    expect(Math.abs(bounds.minZ)).toBeLessThan(4);
    expect(Math.abs(bounds.maxZ)).toBeLessThan(4);
    expect(Math.abs(bounds.minY)).toBeLessThan(6);
    expect(Math.abs(bounds.maxY)).toBeLessThan(6);
  });

  it("creates normalized normals", () => {
    const points = buildHandCloudPoints();
    const normals = points.map((point) => point.normal).filter(Boolean);

    normals.forEach((normal) => {
      const length = magnitude(normal!.x, normal!.y, normal!.z);
      expect(length).toBeGreaterThan(0.94);
      expect(length).toBeLessThan(1.06);
    });
  });
});
