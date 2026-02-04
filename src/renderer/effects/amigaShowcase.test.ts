import { describe, expect, it } from "vitest";

import { hashUnit, resolveTwistX } from "./amigaShowcase";

describe("amigaShowcase helpers", () => {
  it("hashUnit returns deterministic values in the unit range", () => {
    const value = hashUnit(12.34);
    const repeat = hashUnit(12.34);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(1);
    expect(value).toBe(repeat);
  });

  it("resolveTwistX treats normalized values as fractions of width", () => {
    const width = 800;
    expect(resolveTwistX(0.25, width, 0)).toBeCloseTo(200);
    expect(resolveTwistX(-0.5, width, 0)).toBeCloseTo(-400);
  });

  it("resolveTwistX keeps absolute values and uses fallback for invalid input", () => {
    const width = 640;
    expect(resolveTwistX(320, width, 128)).toBeCloseTo(320);
    expect(resolveTwistX(undefined, width, 128)).toBeCloseTo(128);
  });
});
