import { describe, expect, it } from "vitest";

import { generateSilhouettes, getStarAlpha, initStars } from "./synthwaveSunset";

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

  it("keeps computed star alpha clamped and animated over time", () => {
    const star = initStars(999, 1)[0];
    expect(star).toBeDefined();
    if (!star) {
      return;
    }

    const alphaA = getStarAlpha(star, 0, 1);
    const alphaB = getStarAlpha(star, 5, 1);

    expect(alphaA).toBeGreaterThanOrEqual(0.1);
    expect(alphaA).toBeLessThanOrEqual(1);
    expect(alphaB).toBeGreaterThanOrEqual(0.1);
    expect(alphaB).toBeLessThanOrEqual(1);
    expect(alphaA).not.toBe(alphaB);
  });
});
