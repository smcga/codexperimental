import { describe, expect, it } from "vitest";

import { computeShatterTransitionState } from "./shatter";

describe("computeShatterTransitionState", () => {
  it("clamps progress outside the valid range", () => {
    expect(computeShatterTransitionState(-1, 320, 180, 0.2)).toEqual(computeShatterTransitionState(0, 320, 180, 0.2));
    expect(computeShatterTransitionState(2, 320, 180, 0.2)).toEqual(computeShatterTransitionState(1, 320, 180, 0.2));
  });

  it("builds deterministic Voronoi shards that cover the frame", () => {
    const state = computeShatterTransitionState(0.3, 320, 180, 0.1);

    expect(state.shards.length).toBeGreaterThan(12);
    const area = state.shards.reduce((sum, shard) => {
      const polygonArea = shard.polygon.reduce((acc, point, index, polygon) => {
        const next = polygon[(index + 1) % polygon.length];
        return acc + point.x * next.y - next.x * point.y;
      }, 0);
      return sum + Math.abs(polygonArea / 2);
    }, 0);

    expect(area).toBeCloseTo(320 * 180, 3);
  });

  it("pushes shards outward harder on bass hits while revealing the next scene", () => {
    const quiet = computeShatterTransitionState(0.58, 320, 180, 0);
    const loud = computeShatterTransitionState(0.58, 320, 180, 1.2);
    const early = computeShatterTransitionState(0.15, 320, 180, 0.1);
    const late = computeShatterTransitionState(0.9, 320, 180, 0.1);

    const quietTravel = quiet.shards.reduce((sum, shard) => sum + Math.hypot(shard.translateX, shard.translateY), 0);
    const loudTravel = loud.shards.reduce((sum, shard) => sum + Math.hypot(shard.translateX, shard.translateY), 0);
    const earlyAlpha = early.shards.reduce((sum, shard) => sum + shard.alpha, 0);
    const lateAlpha = late.shards.reduce((sum, shard) => sum + shard.alpha, 0);

    expect(loudTravel).toBeGreaterThan(quietTravel);
    expect(late.toAlpha).toBeGreaterThan(early.toAlpha);
    expect(lateAlpha).toBeLessThan(earlyAlpha);
  });
});
