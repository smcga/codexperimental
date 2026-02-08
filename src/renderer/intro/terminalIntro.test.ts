import { describe, expect, it } from "vitest";

import { getIntroExplosionProgress, getTypingReveal, INTRO_EXPLOSION_DURATION } from "./terminalIntro";

describe("getTypingReveal", () => {
  it("reveals characters based on cps and elapsed time", () => {
    expect(getTypingReveal("hello", 10, 0)).toBe(0);
    expect(getTypingReveal("hello", 10, 0.2)).toBe(2);
    expect(getTypingReveal("hello", 10, 0.5)).toBe(5);
  });

  it("clamps reveal length to the text length", () => {
    expect(getTypingReveal("hi", 10, 1)).toBe(2);
  });

  it("returns zero when cps or elapsed time are non-positive", () => {
    expect(getTypingReveal("hello", 0, 1)).toBe(0);
    expect(getTypingReveal("hello", 10, -0.1)).toBe(0);
  });
});

describe("getIntroExplosionProgress", () => {
  it("starts before intro end and clamps to 0..1", () => {
    const introEnd = 10;
    expect(getIntroExplosionProgress(introEnd - INTRO_EXPLOSION_DURATION - 0.01, introEnd)).toBe(0);
    expect(getIntroExplosionProgress(introEnd - INTRO_EXPLOSION_DURATION / 2, introEnd)).toBeCloseTo(0.5);
    expect(getIntroExplosionProgress(introEnd + 0.01, introEnd)).toBe(1);
  });

  it("returns 0 for invalid duration", () => {
    expect(getIntroExplosionProgress(10, 10, 0)).toBe(0);
  });
});
