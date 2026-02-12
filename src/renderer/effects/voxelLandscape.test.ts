import { describe, expect, it } from "vitest";

import { computeLandscapeViewportTuning, generateVoxelLandscapeMaps } from "./voxelLandscape";

describe("voxelLandscape maps", () => {
  it("generates deterministic heightmaps for the same seed", () => {
    const mapsA = generateVoxelLandscapeMaps(42, 64);
    const mapsB = generateVoxelLandscapeMaps(42, 64);

    expect(mapsA.height).toEqual(mapsB.height);
    expect(mapsA.color).toEqual(mapsB.color);
  });

  it("changes the heightmap when the seed changes", () => {
    const mapsA = generateVoxelLandscapeMaps(1, 64);
    const mapsB = generateVoxelLandscapeMaps(2, 64);

    expect(mapsA.height).not.toEqual(mapsB.height);
  });

  it("produces 8-bit height samples and RGB color entries", () => {
    const maps = generateVoxelLandscapeMaps(7, 32);

    expect(maps.height.length).toBe(32 * 32);
    expect(maps.color.length).toBe(32 * 32 * 3);
  });
});

describe("computeLandscapeViewportTuning", () => {
  it("keeps the baseline camera settings for 16:9 viewports", () => {
    expect(computeLandscapeViewportTuning(1600, 900)).toEqual({
      fovMultiplier: 1,
      scaleMultiplier: 1,
      cameraHeightOffset: 0
    });
  });

  it("widens and lifts the camera on tall portrait viewports", () => {
    expect(computeLandscapeViewportTuning(900, 1600)).toEqual({
      fovMultiplier: 1.45,
      scaleMultiplier: 0.6,
      cameraHeightOffset: 26
    });
  });
});
