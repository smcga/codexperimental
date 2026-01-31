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
  it("returns noop when fullscreen and fallback are not enabled", () => {
    expect(getFullscreenAction(false, null, false, false)).toBe("noop");
  });

  it("returns enter when fullscreen is enabled and not active", () => {
    expect(getFullscreenAction(true, null, false, false)).toBe("enter");
  });

  it("returns exit when fullscreen is enabled and active", () => {
    const element = {} as Element;
    expect(getFullscreenAction(true, element, false, false)).toBe("exit");
  });

  it("returns enter-fallback when fullscreen is not enabled and fallback is inactive", () => {
    expect(getFullscreenAction(false, null, true, false)).toBe("enter-fallback");
  });

  it("returns exit-fallback when fullscreen is not enabled and fallback is active", () => {
    expect(getFullscreenAction(false, null, true, true)).toBe("exit-fallback");
  });
});
