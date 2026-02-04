import { describe, expect, it } from "vitest";

import { buildLatLonMesh, buildShapePositions } from "./polyMorphShowcase";

describe("poly morph showcase mesh", () => {
  it("builds a wrapped lat/lon mesh with valid indices", () => {
    const mesh = buildLatLonMesh(8, 12);
    expect(mesh.vertexCount).toBe((8 + 1) * 12);
    expect(mesh.faces.length).toBe(mesh.faceCount * 3);

    for (let i = 0; i < mesh.faces.length; i += 1) {
      expect(mesh.faces[i]).toBeLessThan(mesh.vertexCount);
    }
  });

  it("builds matching shape arrays for morphing", () => {
    const mesh = buildLatLonMesh(6, 10);
    const shapes = buildShapePositions(mesh.uvs, 1.7);
    expect(shapes).toHaveLength(4);
    shapes.forEach((shape) => {
      expect(shape.length).toBe(mesh.vertexCount * 3);
    });
  });
});
