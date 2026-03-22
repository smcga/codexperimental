import { describe, expect, it } from "vitest";

import { computeRealityPeelTransitionState } from "./realityPeel";

describe("computeRealityPeelTransitionState", () => {
  it("clamps progress outside the valid range", () => {
    expect(computeRealityPeelTransitionState(-1, 320, 180)).toEqual(computeRealityPeelTransitionState(0, 320, 180));
    expect(computeRealityPeelTransitionState(2, 320, 180)).toEqual(computeRealityPeelTransitionState(1, 320, 180));
  });

  it("pulls the fold deeper into the frame as the peel progresses", () => {
    const start = computeRealityPeelTransitionState(0.12, 320, 180);
    const mid = computeRealityPeelTransitionState(0.55, 320, 180);
    const end = computeRealityPeelTransitionState(0.92, 320, 180);

    expect(mid.foldX).toBeLessThan(start.foldX);
    expect(mid.foldY).toBeGreaterThan(start.foldY);
    expect(mid.shadowAlpha).toBeGreaterThan(start.shadowAlpha);
    expect(end.flapLeftX).toBeLessThan(mid.flapLeftX);
    expect(end.revealAlpha).toBe(1);
    expect(end.creaseAlpha).toBeGreaterThan(mid.creaseAlpha);
  });
});
