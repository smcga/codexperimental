import { describe, expect, it } from "vitest";

import { getGlenzModel, normalizeGlenzVectorsParams } from "./glenzVectors";

describe("glenz vectors", () => {
  it("normalizes parameters with sensible bounds", () => {
    const params = normalizeGlenzVectorsParams(
      {
        model: "cube",
        instances: 12,
        camDist: 1,
        rotYSpeed: 5,
        faceAlpha: 2,
        edge: false,
        sortFaces: "backToFront"
      },
      800,
      600
    );

    expect(params.model).toBe("cube");
    expect(params.instances).toBe(6);
    expect(params.camDist).toBe(2.2);
    expect(params.rotYSpeed).toBe(2.5);
    expect(params.faceAlpha).toBe(1);
    expect(params.edge).toBe(false);
    expect(params.sortFaces).toBe("backToFront");
    expect(params.focal).toBeCloseTo(510, 2);
  });

  it("exposes the expected model triangle counts", () => {
    const cube = getGlenzModel("cube");
    const octa = getGlenzModel("octa");
    const icosa = getGlenzModel("icosa");

    expect(cube.faceCount).toBe(12);
    expect(octa.faceCount).toBe(8);
    expect(icosa.faceCount).toBe(20);
  });
});
