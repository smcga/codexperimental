import { describe, expect, it } from "vitest";

import { computeBitplaneWipeTransitionState } from "./bitplaneWipe";

describe("computeBitplaneWipeTransitionState", () => {
  it("clamps progress and keeps the band count within the supported range", () => {
    expect(computeBitplaneWipeTransitionState(-1, 320)).toEqual(computeBitplaneWipeTransitionState(0, 320));
    expect(computeBitplaneWipeTransitionState(2, 320)).toEqual(computeBitplaneWipeTransitionState(1, 320));
    expect(computeBitplaneWipeTransitionState(0.5, 80).bands).toHaveLength(8);
    expect(computeBitplaneWipeTransitionState(0.5, 2000).bands).toHaveLength(32);
  });

  it("reveals later bands after earlier ones with deterministic stagger", () => {
    const early = computeBitplaneWipeTransitionState(0.2, 320, 16);
    const mid = computeBitplaneWipeTransitionState(0.55, 320, 16);
    const late = computeBitplaneWipeTransitionState(0.9, 320, 16);

    expect(early.bands[0].progress).toBeGreaterThan(early.bands[15].progress);
    expect(mid.bands.some((band) => band.progress > 0 && band.progress < 1)).toBe(true);
    expect(late.bands.every((band) => band.progress > 0.75)).toBe(true);
  });
});
