import { describe, expect, it } from "vitest";

import { createSeededRng, hslToRgb } from "./metaballs";

describe("metaballs helpers", () => {
  it("creates deterministic seeded RNG output", () => {
    const rng = createSeededRng(1337);
    expect(rng()).toBeCloseTo(0.1844, 4);
    expect(rng()).toBeCloseTo(0.19, 2);
    expect(rng()).toBeCloseTo(0.8105, 3);
  });

  it("converts HSL to RGB", () => {
    const out: [number, number, number] = [0, 0, 0];
    hslToRgb(200, 0.85, 0.55, out);
    expect(out[0]).toBeCloseTo(42.71, 2);
    expect(out[1]).toBeCloseTo(172.76, 2);
    expect(out[2]).toBeCloseTo(237.79, 2);
  });
});
