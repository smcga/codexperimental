import { describe, expect, it } from "vitest";

import { buildVector3dPoints, normalizeVector3dBallsParams } from "./vector3dBalls";

describe("vector3d balls", () => {
  it("clamps point count and resolves defaults", () => {
    const params = normalizeVector3dBallsParams({
      pointCount: 12,
      baseDotSize: 10,
      model: "sphere",
      palette: "spectrum"
    });

    expect(params.pointCount).toBe(80);
    expect(params.baseDotSize).toBe(6);
    expect(params.model).toBe("sphere");
    expect(params.palette).toBe("spectrum");
  });

  it("anchors cube points to faces", () => {
    const points = buildVector3dPoints("cube", 120, 5);
    const epsilon = 1e-4;

    for (let i = 0; i < points.length; i += 3) {
      const x = Math.abs(points[i]);
      const y = Math.abs(points[i + 1]);
      const z = Math.abs(points[i + 2]);
      const anchored = Math.abs(x - 1) < epsilon || Math.abs(y - 1) < epsilon || Math.abs(z - 1) < epsilon;
      expect(anchored).toBe(true);
    }
  });
});
