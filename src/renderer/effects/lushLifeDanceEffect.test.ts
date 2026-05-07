import { describe, expect, it } from "vitest";

import {
  buildHandFingerSegments,
  LUSH_LIFE_DANCE_DEFAULTS,
  resolveLushLifeDanceParams,
  resolveLushLifePoseProgress,
  sampleLushLifePose
} from "./lushLifeDanceEffect";

describe("lushLifeDanceEffect helpers", () => {
  it("clamps params into safe ranges", () => {
    const params = resolveLushLifeDanceParams({ bpm: 32, amplitude: 4, glow: -1, stageHue: 999 });

    expect(params.bpm).toBe(60);
    expect(params.amplitude).toBe(1.8);
    expect(params.glow).toBe(0);
    expect(params.stageHue).toBe(360);
  });

  it("returns deterministic interpolated poses", () => {
    const first = sampleLushLifePose(0.25);
    const second = sampleLushLifePose(0.25);
    const shifted = sampleLushLifePose(0.251);

    expect(first).toEqual(second);
    expect(shifted.rightHandY).not.toBe(first.rightHandY);
  });

  it("plays limb choreography faster than beat bounce timing", () => {
    expect(resolveLushLifePoseProgress(48)).toBeCloseTo(0);
    expect(resolveLushLifePoseProgress(9.6)).toBeCloseTo(0);
    expect(resolveLushLifePoseProgress(2.4)).toBeCloseTo(0.25);
  });

  it("builds five finger segments extending from each wrist", () => {
    const segments = buildHandFingerSegments([100, 100], [90, 102], 8, 1);
    expect(segments).toHaveLength(5);
    segments.forEach((segment) => {
      expect(segment.from).toHaveLength(2);
      expect(segment.to).toHaveLength(2);
      expect(segment.to[0]).toBeGreaterThan(segment.from[0]);
    });
  });

  it("keeps defaults stable for docs", () => {
    expect(LUSH_LIFE_DANCE_DEFAULTS).toMatchObject({
      bpm: 120,
      bounce: 0.7,
      audioReactive: 0.6
    });
  });
});
