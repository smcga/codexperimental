import { describe, expect, it } from "vitest";

import { getIntroExplosionProgress, getIntroLayoutMetrics, getTypingReveal, INTRO_EXPLOSION_DURATION } from "./terminalIntro";

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

describe("getIntroLayoutMetrics", () => {
  const theme = {
    bg: "#000",
    fg: "#fff",
    dim: "#888",
    accent: "#0f0",
    fontFamily: "monospace",
    fontSize: 40,
    lineHeight: 48,
    padding: 28,
    window: {
      chrome: true,
      title: "demo@machine:~"
    }
  };

  it("keeps desktop metrics unchanged on wide viewports", () => {
    expect(getIntroLayoutMetrics(1280, 720, theme)).toMatchObject({
      fontSize: 40,
      lineHeight: 48,
      padding: 28,
      windowWidth: 920,
      windowHeight: 518.4
    });
  });

  it("shrinks typography and expands usable area on narrow viewports", () => {
    expect(getIntroLayoutMetrics(390, 844, theme)).toMatchObject({
      fontSize: 35,
      lineHeight: 43,
      padding: 20,
      windowWidth: 358.8,
      windowHeight: 520
    });
  });
});
