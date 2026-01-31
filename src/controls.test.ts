import { describe, expect, it } from "vitest";

import { getSecondHalfSkipTime } from "./controls";

describe("getSecondHalfSkipTime", () => {
  it("skips forward to the configured second-half time", () => {
    expect(getSecondHalfSkipTime(150, 0, 10)).toBe(150);
  });

  it("does not rewind when already past the second half", () => {
    expect(getSecondHalfSkipTime(150, 0, 180)).toBe(180);
  });

  it("accounts for audio offsets", () => {
    expect(getSecondHalfSkipTime(150, 5, 100)).toBe(145);
  });
});
