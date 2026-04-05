import { describe, expect, it } from "vitest";

import { computePresentTransform, computeScreenSafeRect } from "./present";

describe("computePresentTransform", () => {
  it("computes contain align for top", () => {
    const result = computePresentTransform(390, 844, 320, 180, "top", "containAlign");
    const slotHeight = 844 / 3;
    const drawH = 180 * Math.min(390 / 320, slotHeight / 180);

    expect(result.scale).toBeCloseTo(Math.min(390 / 320, slotHeight / 180), 5);
    expect(result.dx).toBeCloseTo(0, 5);
    expect(result.dy).toBeCloseTo((slotHeight - drawH) / 2, 5);
  });

  it("computes contain align for centre", () => {
    const result = computePresentTransform(390, 844, 320, 180, "centre", "containAlign");
    const slotHeight = 844 / 3;
    const drawH = 180 * Math.min(390 / 320, slotHeight / 180);

    expect(result.dy).toBeCloseTo(slotHeight + (slotHeight - drawH) / 2, 5);
  });

  it("computes contain align for bottom", () => {
    const result = computePresentTransform(390, 844, 320, 180, "bottom", "containAlign");
    const slotHeight = 844 / 3;
    const drawH = 180 * Math.min(390 / 320, slotHeight / 180);

    expect(result.dy).toBeCloseTo(slotHeight * 2 + (slotHeight - drawH) / 2, 5);
  });

  it("stacks top, centre, and bottom into distinct vertical thirds", () => {
    const top = computePresentTransform(390, 844, 320, 180, "top", "containAlign");
    const centre = computePresentTransform(390, 844, 320, 180, "centre", "containAlign");
    const bottom = computePresentTransform(390, 844, 320, 180, "bottom", "containAlign");
    const drawH = 180 * top.scale;

    expect(top.dy + drawH).toBeLessThanOrEqual(centre.dy);
    expect(centre.dy + drawH).toBeLessThanOrEqual(bottom.dy);
  });

  it("uses desktop cinematic transform when align is fill", () => {
    const result = computePresentTransform(390, 844, 320, 180, "fill", "containAlign");

    expect(result.scale).toBeCloseTo(844 / 180, 5);
    expect(result.dy).toBeCloseTo(0, 5);
    expect(result.dx).toBeLessThan(0);
  });
});

describe("computeScreenSafeRect", () => {
  it("computes inset safe rect for phone dimensions", () => {
    const safeRect = computeScreenSafeRect(390, 844);

    expect(safeRect.x).toBe(23);
    expect(safeRect.y).toBe(23);
    expect(safeRect.w).toBe(344);
    expect(safeRect.h).toBe(798);
  });
});
