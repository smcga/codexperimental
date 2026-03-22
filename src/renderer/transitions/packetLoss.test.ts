import { describe, expect, it } from "vitest";

import { computePacketLossTransitionState } from "./packetLoss";

describe("computePacketLossTransitionState", () => {
  it("clamps progress and constrains the generated grid size", () => {
    expect(computePacketLossTransitionState(-1, 320, 180)).toEqual(computePacketLossTransitionState(0, 320, 180));
    expect(computePacketLossTransitionState(2, 320, 180)).toEqual(computePacketLossTransitionState(1, 320, 180));

    const tiny = computePacketLossTransitionState(0.5, 80, 60);
    const huge = computePacketLossTransitionState(0.5, 2000, 1200);

    expect(tiny.cols).toBe(8);
    expect(tiny.rows).toBe(5);
    expect(huge.cols).toBe(20);
    expect(huge.rows).toBe(14);
  });

  it("moves cells from frozen/dropout blocks into the new scene over time", () => {
    const early = computePacketLossTransitionState(0.16, 320, 180, 10, 6);
    const mid = computePacketLossTransitionState(0.5, 320, 180, 10, 6);
    const late = computePacketLossTransitionState(0.92, 320, 180, 10, 6);

    expect(early.cells.some((cell) => cell.freeze > 0.05)).toBe(true);
    expect(mid.cells.some((cell) => cell.dropout > 0.05)).toBe(true);
    expect(mid.cells.some((cell) => cell.reveal > 0 && cell.reveal < 1)).toBe(true);
    expect(late.cells.every((cell) => cell.reveal > 0.6)).toBe(true);
    expect(late.cells.every((cell) => cell.dropout < 0.1)).toBe(true);
  });
});
