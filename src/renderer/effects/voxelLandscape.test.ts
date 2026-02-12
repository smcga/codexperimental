import { describe, expect, it } from "vitest";

import { computeVoxelLandscapeViewSettings, generateVoxelLandscapeMaps } from "./voxelLandscape";

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

  it("keeps base framing values on landscape viewports", () => {
    const settings = {
      fov: 1,
      scale: 120,
      camBase: 110,
      horizon: 90,
      maxDist: 900
    };

    const adjusted = computeVoxelLandscapeViewSettings(1920, 1080, settings);

    expect(adjusted).toEqual(settings);
  });

  it("widens framing and raises the camera on portrait viewports", () => {
    const settings = {
      fov: 1,
      scale: 120,
      camBase: 110,
      horizon: 90,
      maxDist: 900
    };

    const adjusted = computeVoxelLandscapeViewSettings(390, 844, settings);

    expect(adjusted.fov).toBeGreaterThan(settings.fov);
    expect(adjusted.scale).toBeLessThan(settings.scale);
    expect(adjusted.camBase).toBeGreaterThan(settings.camBase);
    expect(adjusted.horizon).toBeGreaterThan(settings.horizon);
    expect(adjusted.maxDist).toBeGreaterThan(settings.maxDist);
  });
});
