import { describe, expect, it } from "vitest";

import {
  computeVisibleLevels,
  normalizeInfiniteZoomDrosteParams
} from "./infiniteZoomDroste";

describe("infiniteZoomDroste params", () => {
  it("normalizes defaults and clamps values", () => {
    const normalized = normalizeInfiniteZoomDrosteParams({
      speed: 99,
      scaleBase: 0.4,
      rotationSpeed: -8,
      detail: 2,
      glow: -1,
      pulse: 3,
      twist: 4,
      seed: 100000,
      shape: "oops",
      fitMode: "what"
    });

    expect(normalized.speed).toBe(1.8);
    expect(normalized.scaleBase).toBe(1.2);
    expect(normalized.rotationSpeed).toBe(-1.2);
    expect(normalized.detail).toBe(1);
    expect(normalized.glow).toBe(0);
    expect(normalized.pulse).toBe(1);
    expect(normalized.twist).toBe(1);
    expect(normalized.seed).toBe(9999);
    expect(normalized.shape).toBe("portal");
    expect(normalized.fitMode).toBe("auto");
  });
});

describe("computeVisibleLevels", () => {
  it("returns deterministic ascending levels within cull bounds", () => {
    const first = computeVisibleLevels(2.125, 2, 0.12, 12);
    const second = computeVisibleLevels(2.125, 2, 0.12, 12);

    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((scale, index) => index === 0 || scale > first[index - 1])).toBe(true);
    expect(first.every((scale) => scale >= 0.12 && scale <= 12)).toBe(true);
  });

  it("progresses continuously across phase wrap", () => {
    const beforeWrap = computeVisibleLevels(3.99, 2, 0.08, 20);
    const afterWrap = computeVisibleLevels(4.01, 2, 0.08, 20);

    expect(beforeWrap.length).toBeGreaterThan(3);
    expect(afterWrap.length).toBeGreaterThan(3);

    afterWrap.forEach((afterScale) => {
      const bestRatioError = beforeWrap.reduce((best, beforeScale) => {
        const candidates = [beforeScale * 0.5, beforeScale, beforeScale * 2];
        const candidateError = candidates.reduce((innerBest, candidate) => {
          return Math.min(innerBest, Math.abs(afterScale / candidate - 1));
        }, Number.POSITIVE_INFINITY);
        return Math.min(best, candidateError);
      }, Number.POSITIVE_INFINITY);

      expect(bestRatioError).toBeLessThan(0.06);
    });
  });
});
