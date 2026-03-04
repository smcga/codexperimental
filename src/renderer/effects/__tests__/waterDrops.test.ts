import { describe, expect, it } from "vitest";

import { createLcg, initializeDroplets, stepDroplets } from "../waterDrops";

describe("waterDrops", () => {
  it("initializes droplets deterministically for a seed", () => {
    const first = initializeDroplets(7, 6, 180, { dripRate: 0.2, size: 1, speed: 0.25 });
    const second = initializeDroplets(7, 6, 180, { dripRate: 0.2, size: 1, speed: 0.25 });

    const pick = (drops: typeof first) =>
      drops.slice(0, 4).map((drop) => ({
        x: Number(drop.x.toFixed(6)),
        y: Number(drop.y.toFixed(6)),
        r: Number(drop.r.toFixed(6)),
        type: drop.type
      }));

    expect(pick(first)).toEqual(pick(second));
  });

  it("wraps droplets from bottom to top deterministically", () => {
    const droplets = initializeDroplets(3, 3, 200, { dripRate: 0.3, size: 1, speed: 0.4 });
    droplets[0].y = 1.2;

    const rngA = createLcg(999);
    const rngB = createLcg(999);

    stepDroplets(droplets, 1, rngA, 200, { dripRate: 0.3, size: 1, speed: 0.4 });

    const comparison = initializeDroplets(3, 3, 200, { dripRate: 0.3, size: 1, speed: 0.4 });
    comparison[0].y = 1.2;
    stepDroplets(comparison, 1, rngB, 200, { dripRate: 0.3, size: 1, speed: 0.4 });

    expect(Number(droplets[0].y.toFixed(6))).toBeLessThan(0);
    expect(
      droplets.map((drop) => [Number(drop.x.toFixed(6)), Number(drop.y.toFixed(6)), Number(drop.r.toFixed(6)), drop.type])
    ).toEqual(comparison.map((drop) => [Number(drop.x.toFixed(6)), Number(drop.y.toFixed(6)), Number(drop.r.toFixed(6)), drop.type]));
  });
});
