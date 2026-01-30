import { describe, expect, it } from "vitest";
import { getFullscreenAction, getNextDebugOverlayVisibility } from "./controls";

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
