import { describe, expect, it } from "vitest";

import {
  buildOccluderShadowPolygon,
  buildShadowVolumeOccluders,
  projectShadowVolumesPoint,
  resolveShadowVolumesParams,
  SHADOW_VOLUMES_DEFAULTS
} from "./shadowVolumes";

describe("shadowVolumes helpers", () => {
  it("resolves defaults and clamps params", () => {
    expect(resolveShadowVolumesParams({})).toEqual({
      ...SHADOW_VOLUMES_DEFAULTS,
      rotateOccluders: true
    });

    expect(
      resolveShadowVolumesParams({
        count: 99,
        speed: -1,
        contrast: 9,
        lightYawAmp: 0,
        lightHeight: -5,
        shadowLength: 99,
        perspective: 0,
        groundGrid: 9,
        rotateOccluders: 0,
        accent: -1,
        beatPunch: 9,
        cameraDrift: -4,
        mobilePadding: 2
      })
    ).toMatchObject({
      count: 14,
      speed: 0.15,
      contrast: 1.5,
      lightYawAmp: 0.1,
      lightHeight: 0.2,
      shadowLength: 3,
      perspective: 0.45,
      groundGrid: 1,
      rotateOccluders: false,
      accent: 0,
      beatPunch: 1,
      cameraDrift: 0,
      mobilePadding: 0.24
    });
  });

  it("builds deterministic occluders for the same seed", () => {
    const first = buildShadowVolumeOccluders(6, 12);
    const second = buildShadowVolumeOccluders(6, 12);
    const different = buildShadowVolumeOccluders(6, 13);

    expect(first).toEqual(second);
    expect(first).not.toEqual(different);
    expect(first).toHaveLength(6);
  });

  it("projects points consistently with depth", () => {
    const camera = { x: 200, y: 0, horizonY: 60, scale: 140, perspective: 1 };
    const near = projectShadowVolumesPoint({ x: 1, y: 1, z: 0 }, camera);
    const far = projectShadowVolumesPoint({ x: 1, y: 8, z: 0 }, camera);

    expect(Number.isFinite(near.x)).toBe(true);
    expect(Number.isFinite(far.y)).toBe(true);
    expect(Math.abs(near.x - camera.x)).toBeGreaterThan(Math.abs(far.x - camera.x));
  });

  it("builds finite shadow polygons", () => {
    const occluder = buildShadowVolumeOccluders(1, 8)[0];
    const polygon = buildOccluderShadowPolygon(occluder, { x: -2, y: -1, z: 5 }, 2.4);

    expect(polygon).toHaveLength(8);
    polygon.forEach((point) => {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(point.z).toBe(0);
    });
  });
});
