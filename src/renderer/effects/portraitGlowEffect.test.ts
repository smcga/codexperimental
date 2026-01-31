import { describe, expect, it } from "vitest";

import { computeCoverPlacement } from "./portraitGlowEffect";

describe("computeCoverPlacement", () => {
  it("covers the canvas and centers the image for a landscape asset", () => {
    const placement = computeCoverPlacement(800, 600, 1600, 900);

    expect(placement.width).toBeGreaterThanOrEqual(800);
    expect(placement.height).toBeGreaterThanOrEqual(600);
    expect(placement.x).toBeLessThanOrEqual(0);
    expect(placement.y).toBeLessThanOrEqual(0);
  });

  it("scales up when a zoom multiplier is provided", () => {
    const base = computeCoverPlacement(800, 600, 800, 1200, 1);
    const zoomed = computeCoverPlacement(800, 600, 800, 1200, 1.1);

    expect(zoomed.width).toBeGreaterThan(base.width);
    expect(zoomed.height).toBeGreaterThan(base.height);
    expect(zoomed.x).toBeLessThan(base.x);
    expect(zoomed.y).toBeLessThan(base.y);
  });

  it("returns zero placement for invalid dimensions", () => {
    const placement = computeCoverPlacement(0, 0, 0, 0);

    expect(placement).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });
});
