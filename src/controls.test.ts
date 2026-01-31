import { describe, expect, it } from "vitest";
import { getFullscreenAction, getIntroSkipTime, getNextDebugOverlayVisibility } from "./controls";

describe("getNextDebugOverlayVisibility", () => {
  it("toggles from hidden to visible", () => {
    expect(getNextDebugOverlayVisibility(false)).toBe(true);
  });

  it("toggles from visible to hidden", () => {
    expect(getNextDebugOverlayVisibility(true)).toBe(false);
  });
});

describe("getFullscreenAction", () => {
  it("returns noop when fullscreen is not enabled", () => {
    expect(getFullscreenAction(false, null)).toBe("noop");
  });

  it("returns enter when fullscreen is enabled and not active", () => {
    expect(getFullscreenAction(true, null)).toBe("enter");
  });

  it("returns exit when fullscreen is enabled and active", () => {
    const element = {} as Element;
    expect(getFullscreenAction(true, element)).toBe("exit");
  });
});

describe("getIntroSkipTime", () => {
  it("skips ahead to the intro end relative to the audio offset", () => {
    expect(getIntroSkipTime(12, 2, 1)).toBe(10);
  });

  it("does not move backwards if already past the intro end", () => {
    expect(getIntroSkipTime(12, 2, 11)).toBe(11);
  });

  it("clamps to zero when the offset surpasses the intro end", () => {
    expect(getIntroSkipTime(1, 3, 0.2)).toBe(0.2);
    expect(getIntroSkipTime(1, 3, 0)).toBe(0);
  });
});
