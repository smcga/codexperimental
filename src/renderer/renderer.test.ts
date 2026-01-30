import { describe, expect, it } from "vitest";

import { MONOCHROME_UNTIL_SECONDS, isMonochromeTime, resolveMonochrome } from "./monochrome";

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
