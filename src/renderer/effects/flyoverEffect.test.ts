import { describe, expect, it } from "vitest";

import { generateFlyoverIslands, valueNoise1D } from "./flyoverEffect";

describe("flyoverEffect helpers", () => {
  it("generates deterministic island silhouettes for a seed", () => {
    const first = generateFlyoverIslands(12, 4);
    const second = generateFlyoverIslands(12, 4);

    expect(second).toEqual(first);
  });

  it("changes island output when the seed changes", () => {
    const first = generateFlyoverIslands(12, 4);
    const second = generateFlyoverIslands(13, 4);

    expect(second[0].samples[10]).not.toBe(first[0].samples[10]);
  });

  it("returns stable value noise samples", () => {
    const first = valueNoise1D(1.25, 8);
    const second = valueNoise1D(1.25, 8);

    expect(first).toBeCloseTo(second, 8);
  });
});
