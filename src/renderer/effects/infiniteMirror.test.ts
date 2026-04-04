import { describe, expect, it } from "vitest";

import {
  detectTimeJump,
  normalizeInfiniteMirrorParams,
  resolveEffectiveDepth,
  resolveEraMultipliers,
  INFINITE_MIRROR_DEFAULTS
} from "./infiniteMirror";

describe("infiniteMirror helpers", () => {
  it("normalizes params to defaults and clamps ranges", () => {
    const normalized = normalizeInfiniteMirrorParams({
      depth: 200,
      scale: 0.2,
      rotation: 4,
      twist: -5,
      offsetX: 3,
      offsetY: -3,
      pulse: 9,
      glow: -1,
      softness: 1,
      vignette: 2,
      monochrome: 2,
      mirrorFrames: 0,
      baseScene: "not-valid",
      symmetry: -4,
      strobeOnBeat: 4,
      feedbackMix: 0.1
    });

    expect(normalized.depth).toBe(48);
    expect(normalized.scale).toBe(0.6);
    expect(normalized.rotation).toBe(1.5);
    expect(normalized.twist).toBe(-0.5);
    expect(normalized.offsetX).toBe(0.5);
    expect(normalized.offsetY).toBe(-0.5);
    expect(normalized.pulse).toBe(2);
    expect(normalized.glow).toBe(0);
    expect(normalized.softness).toBe(0.5);
    expect(normalized.vignette).toBe(1);
    expect(normalized.monochrome).toBe(1);
    expect(normalized.mirrorFrames).toBe(false);
    expect(normalized.baseScene).toBe(INFINITE_MIRROR_DEFAULTS.baseScene);
    expect(normalized.symmetry).toBe(0);
    expect(normalized.strobeOnBeat).toBe(1);
    expect(normalized.feedbackMix).toBe(0.3);
  });

  it("detects time jumps for feedback reset", () => {
    expect(detectTimeJump(2, null)).toBe(false);
    expect(detectTimeJump(2.1, 2)).toBe(false);
    expect(detectTimeJump(2.8, 2)).toBe(true);
  });

  it("caps effective depth by resolution and era", () => {
    const future = resolveEraMultipliers("future");
    const lowResDepth = resolveEffectiveDepth(30, 640, 360, future.depth);
    const highResDepth = resolveEffectiveDepth(30, 2560, 1440, future.depth);

    expect(lowResDepth).toBeGreaterThan(highResDepth);
    expect(highResDepth).toBeGreaterThanOrEqual(1);
    expect(lowResDepth).toBeLessThanOrEqual(48);
  });
});
