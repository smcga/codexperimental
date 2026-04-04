import { describe, expect, it } from "vitest";

import {
  MOVING_SHADOW_MAP_DEFAULTS,
  buildShadowPolygon,
  lightHeightToShadowScale,
  resolveMovingShadowMapParams,
  worldToScreen
} from "./movingShadowMap";

describe("lightHeightToShadowScale", () => {
  it("returns shorter shadows for higher light positions", () => {
    const low = lightHeightToShadowScale(1.6, 1.6, 4.4, 1.35);
    const high = lightHeightToShadowScale(4.4, 1.6, 4.4, 1.35);

    expect(low).toBeGreaterThan(high);
  });
});

describe("worldToScreen", () => {
  it("is deterministic for stable inputs", () => {
    const config = {
      width: 640,
      height: 360,
      horizon: 80,
      cameraHeight: 4.9,
      cameraZ: -5.5,
      focal: 5.2,
      scale: 420
    };

    const first = worldToScreen(1.5, 0.3, 6.2, config);
    const second = worldToScreen(1.5, 0.3, 6.2, config);

    expect(first).toEqual(second);
  });
});

describe("buildShadowPolygon", () => {
  it("moves projected shadow points when the light position changes", () => {
    const params = resolveMovingShadowMapParams({ ...MOVING_SHADOW_MAP_DEFAULTS });
    const object = { x: 0, z: 6, width: 1, depth: 1, height: 2, style: "box" as const, tone: 1 };

    const nearLight = { x: -2, y: 1.8, z: 5.4, intensity: 1 };
    const farLight = { x: 2.5, y: 4.2, z: 7.1, intensity: 1 };

    const nearPolygon = buildShadowPolygon(object, nearLight, params);
    const farPolygon = buildShadowPolygon(object, farLight, params);

    expect(nearPolygon[2].x).not.toBeCloseTo(farPolygon[2].x, 5);
    expect(nearPolygon[2].y).not.toBeCloseTo(farPolygon[2].y, 5);
  });
});
