import { describe, expect, it } from "vitest";

import { createEnvMap, sphereMapUv } from "./envmapDonut";

describe("envmap donut helpers", () => {
  it("maps a forward reflection to the center of the sphere map", () => {
    const { u, v } = sphereMapUv(0, 0, 1);
    expect(u).toBeCloseTo(0.5, 4);
    expect(v).toBeCloseTo(0.5, 4);
  });

  it("builds a deterministic sky-to-warm gradient", () => {
    const env = createEnvMap(8, 8, 12);
    const env2 = createEnvMap(8, 8, 12);
    expect(env[10]).toBe(env2[10]);

    const topIdx = 0;
    const bottomIdx = (8 * 7) * 3;
    const topR = env[topIdx];
    const topB = env[topIdx + 2];
    const bottomR = env[bottomIdx];
    const bottomB = env[bottomIdx + 2];

    expect(topB).toBeGreaterThan(topR);
    expect(bottomR).toBeGreaterThan(bottomB);
  });
});
