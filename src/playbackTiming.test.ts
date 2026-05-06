import { describe, expect, it } from "vitest";

import { clampLatencyCompensation, getDemoTimeFromAudio } from "./playbackTiming";

describe("playbackTiming", () => {
  it("clamps latency compensation to a safe range", () => {
    expect(clampLatencyCompensation(-0.1)).toBe(0);
    expect(clampLatencyCompensation(0.08)).toBe(0.08);
    expect(clampLatencyCompensation(0.4)).toBe(0.25);
  });

  it("derives demo time from audio time, offset, and latency compensation", () => {
    expect(getDemoTimeFromAudio(100, -0.128, 0.05)).toBeCloseTo(99.822, 5);
  });
});

