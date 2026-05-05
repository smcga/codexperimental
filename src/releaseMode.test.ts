import { describe, expect, it } from "vitest";
import { isReleaseMode, shouldEnableCommunityFeatures, shouldEnableViewCounter, shouldShowShareUi } from "./releaseMode";

describe("releaseMode helpers", () => {
  it("detects ?release=1", () => {
    expect(isReleaseMode(new URLSearchParams("release=1"))).toBe(true);
    expect(isReleaseMode(new URLSearchParams("release=0"))).toBe(false);
    expect(isReleaseMode(new URLSearchParams(""))).toBe(false);
  });

  it("disables community features in release mode", () => {
    expect(shouldEnableCommunityFeatures(true)).toBe(false);
    expect(shouldEnableCommunityFeatures(false)).toBe(true);
  });

  it("disables view counter in release mode", () => {
    expect(shouldEnableViewCounter(true)).toBe(false);
    expect(shouldEnableViewCounter(false)).toBe(true);
  });

  it("hides share UI in release mode", () => {
    expect(shouldShowShareUi(true)).toBe(false);
    expect(shouldShowShareUi(false)).toBe(true);
  });
});
