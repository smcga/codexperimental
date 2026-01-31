import { describe, expect, it } from "vitest";

import { faceNormal, projectPoint, rotateX, rotateY, rotateZ } from "./threeDMath";

describe("threeDMath", () => {
  it("rotates points around each axis", () => {
    const point = { x: 1, y: 0, z: 0 };
    const rotatedY = rotateY(point, Math.PI / 2);
    expect(rotatedY.x).toBeCloseTo(0, 4);
    expect(rotatedY.z).toBeCloseTo(-1, 4);

    const rotatedX = rotateX({ x: 0, y: 1, z: 0 }, Math.PI / 2);
    expect(rotatedX.y).toBeCloseTo(0, 4);
    expect(rotatedX.z).toBeCloseTo(1, 4);

    const rotatedZ = rotateZ({ x: 0, y: 1, z: 0 }, Math.PI / 2);
    expect(rotatedZ.x).toBeCloseTo(-1, 4);
    expect(rotatedZ.y).toBeCloseTo(0, 4);
  });

  it("projects points with perspective", () => {
    const projected = projectPoint({ x: 1, y: 1, z: 0 }, 5, 2.5);
    expect(projected.x).toBeCloseTo(0.5, 3);
    expect(projected.y).toBeCloseTo(0.5, 3);
    expect(projected.scale).toBeGreaterThan(0);
  });

  it("computes a normalized face normal", () => {
    const normal = faceNormal({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    expect(normal.x).toBeCloseTo(0, 4);
    expect(normal.y).toBeCloseTo(0, 4);
    expect(normal.z).toBeCloseTo(1, 4);
  });
});
