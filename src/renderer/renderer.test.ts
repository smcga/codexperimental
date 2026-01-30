import { describe, expect, it } from "vitest";

import { AudioFeatures } from "../audio/audioPlayer";
import { MONOCHROME_UNTIL_SECONDS, isMonochromeTime, resolveMonochrome } from "./monochrome";
import { computeDynamicCamera } from "./camera";

const baseAudio: AudioFeatures = {
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0
};

describe("isMonochromeTime", () => {
  it("treats times before the cutoff as monochrome", () => {
    expect(isMonochromeTime(0)).toBe(true);
    expect(isMonochromeTime(MONOCHROME_UNTIL_SECONDS - 0.001)).toBe(true);
  });

  it("treats the cutoff and later times as full color", () => {
    expect(isMonochromeTime(MONOCHROME_UNTIL_SECONDS)).toBe(false);
    expect(isMonochromeTime(MONOCHROME_UNTIL_SECONDS + 5)).toBe(false);
  });
});

describe("computeDynamicCamera", () => {
  it("clamps zoom within the expected bounds", () => {
    const camera = computeDynamicCamera(10, { ...baseAudio, bass: 1, beatStrength: 1 }, 320, 180);
    expect(camera.zoom).toBeGreaterThanOrEqual(1);
    expect(camera.zoom).toBeLessThanOrEqual(1.12);
  });

  it("uses the base dimensions for drift when audio energy is quiet", () => {
    const camera = computeDynamicCamera(0, baseAudio, 320, 180);
    expect(camera.panX).toBeCloseTo(0, 5);
    expect(camera.panY).toBeCloseTo(180 * 0.03, 5);
  });
});

describe("resolveMonochrome", () => {
  it("falls back to the default monochrome timing when override is unset", () => {
    expect(resolveMonochrome(0, null)).toBe(true);
    expect(resolveMonochrome(MONOCHROME_UNTIL_SECONDS + 1, undefined)).toBe(false);
  });

  it("respects explicit overrides", () => {
    expect(resolveMonochrome(0, true)).toBe(true);
    expect(resolveMonochrome(0, false)).toBe(false);
  });
});
