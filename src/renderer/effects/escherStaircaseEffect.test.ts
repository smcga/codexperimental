import { describe, expect, it } from "vitest";

import { resolveLoopPosition } from "./escherStaircaseEffect";

describe("escherStaircaseEffect loop helpers", () => {
  it("resolves positions along each side of the loop", () => {
    expect(resolveLoopPosition(0, 4)).toEqual({ x: 0, y: 0, side: 0, t: 0 });
    expect(resolveLoopPosition(3, 4)).toEqual({ x: 3, y: 0, side: 0, t: 0.75 });
    expect(resolveLoopPosition(4, 4)).toEqual({ x: 4, y: 0, side: 1, t: 0 });
    expect(resolveLoopPosition(7, 4)).toEqual({ x: 4, y: 3, side: 1, t: 0.75 });
    expect(resolveLoopPosition(8, 4)).toEqual({ x: 4, y: 4, side: 2, t: 0 });
    expect(resolveLoopPosition(11, 4)).toEqual({ x: 1, y: 4, side: 2, t: 0.75 });
    expect(resolveLoopPosition(12, 4)).toEqual({ x: 0, y: 4, side: 3, t: 0 });
    expect(resolveLoopPosition(15, 4)).toEqual({ x: 0, y: 1, side: 3, t: 0.75 });
  });

  it("wraps progress values across the loop length", () => {
    expect(resolveLoopPosition(16, 4)).toEqual({ x: 0, y: 0, side: 0, t: 0 });
    expect(resolveLoopPosition(-1, 4)).toEqual({ x: 0, y: 1, side: 3, t: 0.75 });
  });
});
