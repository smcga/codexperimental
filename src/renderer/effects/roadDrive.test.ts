import { describe, expect, it } from "vitest";

import {
  buildRoadDriveIndices,
  buildRoadDriveVertices,
  normalizeRoadDriveParams,
  ROAD_DRIVE_DEFAULTS
} from "./roadDrive";

describe("roadDrive helpers", () => {
  it("normalizes params with defaults and clamps", () => {
    expect(normalizeRoadDriveParams({})).toEqual(ROAD_DRIVE_DEFAULTS);

    expect(
      normalizeRoadDriveParams({
        speed: -1,
        roadWidth: 100,
        laneDashLength: 0.01,
        laneGap: 999,
        fog: 1.5,
        glow: 0,
        cameraBob: -2,
        curveStrength: 999,
        curveFrequency: -5,
        bassReactive: 5,
        rmsReactive: -3
      })
    ).toEqual({
      speed: 0.2,
      roadWidth: 20,
      laneDashLength: 0.4,
      laneGap: 10,
      fog: 1,
      glow: 0.1,
      cameraBob: 0,
      curveStrength: 6,
      curveFrequency: 0.015,
      bassReactive: 2,
      rmsReactive: 0
    });
  });


  it("clamps curve frequency to the supported max", () => {
    expect(normalizeRoadDriveParams({ curveFrequency: 99 }).curveFrequency).toBe(0.2);
  });

  it("builds deterministic road vertices", () => {
    const first = buildRoadDriveVertices(5, 4, 12, 40);
    const second = buildRoadDriveVertices(5, 4, 12, 40);

    expect(Array.from(first)).toEqual(Array.from(second));
    expect(first.length).toBe(5 * 4 * 2);
    expect(first[0]).toBeCloseTo(-6);
    expect(first[first.length - 1]).toBeCloseTo(40);
  });

  it("builds triangle indices with expected count and valid ranges", () => {
    const resX = 6;
    const resZ = 5;
    const indices = buildRoadDriveIndices(resX, resZ);
    const vertexCount = resX * resZ;

    expect(indices.length).toBe((resX - 1) * (resZ - 1) * 6);
    indices.forEach((index) => {
      expect(index).toBeLessThan(vertexCount);
      expect(index).toBeGreaterThanOrEqual(0);
    });
  });
});
