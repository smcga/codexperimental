import { describe, expect, it } from "vitest";

import {
  computeVoxelColumnHeight,
  createVoxelWorldLayout,
  normalizeVoxelWorldBuilderParams,
  voxelBuildPhases
} from "./VoxelWorldBuilder";

describe("VoxelWorldBuilder params", () => {
  it("clamps the exposed parameter ranges", () => {
    const params = normalizeVoxelWorldBuilderParams({
      buildProgress: 2,
      cityDensity: -1,
      glow: 8,
      cameraLift: -4,
      seed: 99
    });

    expect(params.buildProgress).toBe(1);
    expect(params.cityDensity).toBe(0);
    expect(params.glow).toBe(2);
    expect(params.cameraLift).toBe(-0.25);
    expect(params.seed).toBe(99);
  });
});

describe("VoxelWorldBuilder layout", () => {
  it("builds a complete 64x64 instancing dataset", () => {
    const layout = createVoxelWorldLayout(64, 0.65, 11);

    expect(layout.offsets.length).toBe(64 * 64 * 2);
    expect(layout.terrainHeights.length).toBe(64 * 64);
    expect(layout.buildingHeights.length).toBe(64 * 64);
    expect(layout.emissiveSeeds.length).toBe(64 * 64);
  });

  it("keeps city structure with avenue gaps and denser center towers", () => {
    const layout = createVoxelWorldLayout(64, 0.8, 13);
    let avenueBuildings = 0;
    let centreBuildings = 0;
    let edgeBuildings = 0;

    for (let z = 0; z < 64; z += 1) {
      for (let x = 0; x < 64; x += 1) {
        const idx = z * 64 + x;
        const isBuilding = layout.buildingHeights[idx] > 0;
        const isAvenue = x % 8 === 0 || z % 8 === 0;
        if (isAvenue && isBuilding) {
          avenueBuildings += 1;
        }
        const dist = Math.hypot(x - 31.5, z - 31.5);
        if (dist < 13 && isBuilding) {
          centreBuildings += 1;
        }
        if (dist > 25 && isBuilding) {
          edgeBuildings += 1;
        }
      }
    }

    expect(avenueBuildings).toBe(0);
    expect(centreBuildings).toBeGreaterThan(edgeBuildings);
  });
});

describe("VoxelWorldBuilder phase model", () => {
  it("applies staged terrain -> buildings -> glow timing", () => {
    const early = voxelBuildPhases(0.2);
    const mid = voxelBuildPhases(0.6);
    const late = voxelBuildPhases(0.95);

    expect(early.terrain).toBeGreaterThan(0);
    expect(early.buildings).toBe(0);
    expect(mid.buildings).toBeGreaterThan(0);
    expect(late.glowBoost).toBeGreaterThan(0);
  });

  it("maps documented buildProgress ranges to intended phase dominance", () => {
    const phaseA = voxelBuildPhases(0.2);
    const phaseB = voxelBuildPhases(0.6);
    const phaseC = voxelBuildPhases(0.9);

    expect(phaseA.terrain).toBeGreaterThan(phaseA.buildings);
    expect(phaseA.glowBoost).toBe(0);

    expect(phaseB.terrain).toBe(1);
    expect(phaseB.buildings).toBeGreaterThan(0);
    expect(phaseB.glowBoost).toBe(0);

    expect(phaseC.terrain).toBe(1);
    expect(phaseC.buildings).toBe(1);
    expect(phaseC.glowBoost).toBeGreaterThan(0);
  });

  it("raises columns monotonically as build progress increases", () => {
    const t = 3;
    const b = 18;

    const h0 = computeVoxelColumnHeight(t, b, 0.1);
    const h1 = computeVoxelColumnHeight(t, b, 0.5);
    const h2 = computeVoxelColumnHeight(t, b, 0.9);

    expect(h0).toBeLessThanOrEqual(h1);
    expect(h1).toBeLessThanOrEqual(h2);
  });
});
