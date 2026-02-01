import { describe, expect, it } from "vitest";

import { DEFAULT_FLYOVER_PARAMS, coerceFlyoverParams } from "./flyoverDebug";

describe("coerceFlyoverParams", () => {
  it("falls back to defaults for invalid input", () => {
    const params = coerceFlyoverParams({
      speed: Number.NaN,
      horizon: -2,
      palette: "nope" as "day"
    });

    expect(params.speed).toBe(DEFAULT_FLYOVER_PARAMS.speed);
    expect(params.horizon).toBe(0);
    expect(params.palette).toBe(DEFAULT_FLYOVER_PARAMS.palette);
  });

  it("rounds island values and clamps ranges", () => {
    const params = coerceFlyoverParams({
      islandCount: 2.8,
      islandSeed: 4.2,
      fog: 2,
      audioReactive: -1
    });

    expect(params.islandCount).toBe(3);
    expect(params.islandSeed).toBe(4);
    expect(params.fog).toBe(1);
    expect(params.audioReactive).toBe(0);
  });
});
