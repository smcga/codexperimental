import { describe, expect, it } from "vitest";

import { computeShatterTransitionState, createShatterTransitionLayout } from "./shatterTransition";

describe("shatterTransition", () => {
  it("builds deterministic Voronoi shards inside the frame", () => {
    const layoutA = createShatterTransitionLayout(320, 180);
    const layoutB = createShatterTransitionLayout(320, 180);

    expect(layoutA).toEqual(layoutB);
    expect(layoutA.shards.length).toBeGreaterThanOrEqual(16);
    expect(layoutA.shards.length).toBeLessThanOrEqual(18);

    for (const shard of layoutA.shards) {
      expect(shard.polygon.length).toBeGreaterThanOrEqual(3);
      for (const point of shard.polygon) {
        expect(point.x).toBeGreaterThanOrEqual(-0.001);
        expect(point.x).toBeLessThanOrEqual(320.001);
        expect(point.y).toBeGreaterThanOrEqual(-0.001);
        expect(point.y).toBeLessThanOrEqual(180.001);
      }
    }
  });

  it("pushes shards farther outward on bass-heavy impacts while fading in the next scene", () => {
    const layout = createShatterTransitionLayout(320, 180);
    const calm = computeShatterTransitionState(layout, 0.6, 0.1, 0.05);
    const heavy = computeShatterTransitionState(layout, 0.6, 1, 1);

    const calmTravel = calm.shards.reduce((sum, shard) => sum + Math.hypot(shard.offsetX, shard.offsetY), 0);
    const heavyTravel = heavy.shards.reduce((sum, shard) => sum + Math.hypot(shard.offsetX, shard.offsetY), 0);

    expect(heavyTravel).toBeGreaterThan(calmTravel);
    expect(heavy.toAlpha).toBeGreaterThan(0.7);
    expect(calm.shards.some((shard) => shard.alpha < 1)).toBe(true);
  });
});
