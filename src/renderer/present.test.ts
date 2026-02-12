import { describe, expect, it } from "vitest";

import { computePresentTransform, computeScreenSafeRect } from "./present";

describe("computePresentTransform", () => {
  it("computes contain align for top", () => {
    const result = computePresentTransform(390, 844, 320, 180, "top", "containAlign");

    expect(result.scale).toBeCloseTo(390 / 320, 5);
    expect(result.dx).toBeCloseTo(0, 5);
    expect(result.dy).toBeCloseTo(0, 5);
  });

  it("computes contain align for centre", () => {
    const result = computePresentTransform(390, 844, 320, 180, "centre", "containAlign");
    const drawH = 180 * (390 / 320);

    expect(result.dy).toBeCloseTo((844 - drawH) / 2, 5);
  });

  it("computes contain align for bottom", () => {
    const result = computePresentTransform(390, 844, 320, 180, "bottom", "containAlign");
    const drawH = 180 * (390 / 320);

    expect(result.dy).toBeCloseTo(844 - drawH, 5);
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
