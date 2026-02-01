import { describe, expect, it } from "vitest";

import { generateIslands } from "./flyoverEffect";

describe("flyoverEffect helpers", () => {
  it("generates deterministic island silhouettes for the same seed", () => {
    const islandsA = generateIslands(42, 4);
    const islandsB = generateIslands(42, 4);

    expect(islandsA).toEqual(islandsB);
  });

  it("changes island silhouettes when the seed changes", () => {
    const islandsA = generateIslands(1, 3);
    const islandsB = generateIslands(2, 3);

    expect(islandsA).not.toEqual(islandsB);
  });

  it("respects the requested island count", () => {
    const islands = generateIslands(7, 5);

    expect(islands).toHaveLength(5);
    expect(islands[0]?.samples.length).toBeGreaterThan(0);
  });
});
