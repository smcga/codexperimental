import { describe, expect, it } from "vitest";

import {
  buildLushLifeOutfitAnchors,
  buildHandFingerSegments,
  LUSH_LIFE_DANCE_DEFAULTS,
  resolveLushLifeHairProfile,
  resolveLushLifeDanceParams,
  resolveLushLifePoseProgress,
  sampleLushLifePose
} from "./lushLifeDanceEffect";

describe("lushLifeDanceEffect helpers", () => {
  it("clamps params into safe ranges", () => {
    const params = resolveLushLifeDanceParams({ bpm: 32, amplitude: 4, glow: -1, stageHue: 999, sparkle: 2, fashionDetail: -2 });

    expect(params.bpm).toBe(60);
    expect(params.amplitude).toBe(1.8);
    expect(params.glow).toBe(0);
    expect(params.stageHue).toBe(360);
    expect(params.sparkle).toBe(1);
    expect(params.fashionDetail).toBe(0);
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

  it("mirrors finger fan direction by spread sign", () => {
    const rightFan = buildHandFingerSegments([100, 100], [90, 100], 8, 1);
    const leftFan = buildHandFingerSegments([100, 100], [90, 100], 8, -1);
    expect(rightFan[0].to[1]).toBeGreaterThan(leftFan[0].to[1]);
  });

  it("builds anchored outfit silhouette with narrower waist than shoulders", () => {
    const anchors = buildLushLifeOutfitAnchors({ chest: [100, 100], hip: [110, 140] }, 120);
    const shoulderSpan = anchors.rightShoulder[0] - anchors.leftShoulder[0];
    const waistSpan = anchors.rightWaist[0] - anchors.leftWaist[0];
    const hipSpan = anchors.rightHip[0] - anchors.leftHip[0];
    expect(waistSpan).toBeLessThan(shoulderSpan);
    expect(waistSpan).toBeLessThan(hipSpan);
  });

  it("builds a fuller hair profile as fashion detail increases", () => {
    const low = resolveLushLifeHairProfile(0);
    const high = resolveLushLifeHairProfile(1);
    expect(high.widthMul).toBeGreaterThan(low.widthMul);
    expect(high.dropMul).toBeGreaterThan(low.dropMul);
  });

  it("keeps defaults stable for docs", () => {
    expect(LUSH_LIFE_DANCE_DEFAULTS).toMatchObject({
      bpm: 120,
      bounce: 0.7,
      audioReactive: 0.6,
      hairHue: 48,
      sparkle: 0.65
    });
  });
});
