import { describe, expect, it } from "vitest";
import { computePresentationTime } from "./audioPlayer";

describe("computePresentationTime", () => {
  it("smooths coarse media time updates while playing", () => {
    const state = { anchorMediaTime: 10, anchorNowMs: 1_000, lastPresentedTime: 10 };
    const next = computePresentationTime(10.01, false, 1_100, state, 0.12);
    expect(next).toBeCloseTo(10.1, 3);
  });

  it("never runs behind the reported media clock", () => {
    const state = { anchorMediaTime: 10, anchorNowMs: 1_000, lastPresentedTime: 10.05 };
    const next = computePresentationTime(10.2, false, 1_020, state, 0.12);
    expect(next).toBeCloseTo(10.2, 5);
  });

  it("does not extrapolate while paused", () => {
    const state = { anchorMediaTime: 10, anchorNowMs: 1_000, lastPresentedTime: 10 };
    const next = computePresentationTime(10.04, true, 2_000, state, 0.12);
    expect(next).toBeCloseTo(10.04, 5);
  });
});
