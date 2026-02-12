import { describe, expect, it } from "vitest";

import { fitCircleToSafe, fitSquareToSafe } from "./framingFit";

describe("framing fit helpers", () => {
  it("keeps square size when already within safe rect", () => {
    expect(fitSquareToSafe(100, { x: 0, y: 0, w: 140, h: 130 })).toBe(100);
  });

  it("shrinks square size to fit safe rect", () => {
    expect(fitSquareToSafe(220, { x: 0, y: 0, w: 160, h: 150 })).toBe(150);
  });

  it("shrinks circle radius to safe rect half extents", () => {
    expect(fitCircleToSafe(120, { x: 0, y: 0, w: 140, h: 200 })).toBe(70);
  });
});
