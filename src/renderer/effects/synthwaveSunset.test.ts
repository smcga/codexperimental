import { describe, expect, it } from "vitest";

import { generateSilhouettes, initStars } from "./synthwaveSunset";

describe("synthwaveSunset helpers", () => {
  it("creates deterministic starfields from the same seed", () => {
    const starsA = initStars(1234, 5);
    const starsB = initStars(1234, 5);

    expect(starsA).toEqual(starsB);
  });

  it("changes star distribution when the seed changes", () => {
    const starsA = initStars(1234, 5);
    const starsB = initStars(5678, 5);

    expect(starsA).not.toEqual(starsB);
  });

  it("generates skyline silhouettes with the requested count", () => {
    const silhouettes = generateSilhouettes(42, 8);

    expect(silhouettes).toHaveLength(8);
    expect(silhouettes[0]?.width).toBeGreaterThan(0);
  });
});
