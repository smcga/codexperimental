import { describe, expect, it } from "vitest";

import { MONOCHROME_UNTIL_SECONDS, isMonochromeTime } from "./monochrome";

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
