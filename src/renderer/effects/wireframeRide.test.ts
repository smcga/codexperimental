import { describe, expect, it } from "vitest";
import { buildWireframeGridIndices, buildWireframeGridVertices } from "./wireframeRide";

describe("wireframeRide helpers", () => {
  it("builds deterministic grid vertices", () => {
    const first = buildWireframeGridVertices(6, 4, 10, 20);
    const second = buildWireframeGridVertices(6, 4, 10, 20);
    expect(Array.from(first)).toEqual(Array.from(second));
    expect(first.length).toBe(6 * 4 * 2);
  });

  it("builds grid indices with expected length", () => {
    const resX = 5;
    const resZ = 3;
    const indices = buildWireframeGridIndices(resX, resZ);
    const expectedLines = resZ * (resX - 1) + resX * (resZ - 1);
    expect(indices.length).toBe(expectedLines * 2);
  });

  it("does not generate out-of-range indices", () => {
    const resX = 12;
    const resZ = 8;
    const indices = buildWireframeGridIndices(resX, resZ);
    const vertexCount = resX * resZ;
    indices.forEach((index) => {
      expect(index).toBeLessThan(vertexCount);
    });
  });
});
