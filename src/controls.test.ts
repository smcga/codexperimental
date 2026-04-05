import { describe, expect, it } from "vitest";

import { getEndSkipTime, getRelativeSeekTime, getSecondHalfSkipTime } from "./controls";

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

describe("getRelativeSeekTime", () => {
  it("moves forward by the delta when duration is known", () => {
    expect(getRelativeSeekTime(12, 10, 100)).toBe(22);
  });

  it("clamps to zero when rewinding past the start", () => {
    expect(getRelativeSeekTime(4, -10, 100)).toBe(0);
  });

  it("clamps to duration when seeking past the end", () => {
    expect(getRelativeSeekTime(98, 10, 100)).toBe(100);
  });

  it("does not clamp to duration when duration is unknown", () => {
    expect(getRelativeSeekTime(5, 10, 0)).toBe(15);
  });
});

describe("getEndSkipTime", () => {
  it("skips to just before the track end by default", () => {
    expect(getEndSkipTime(50, 180)).toBe(179.9);
  });

  it("does not rewind when already at the end", () => {
    expect(getEndSkipTime(179.95, 180)).toBe(179.95);
  });

  it("returns current time when duration is unknown", () => {
    expect(getEndSkipTime(42, 0)).toBe(42);
  });
});
