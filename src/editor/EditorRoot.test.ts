import { describe, expect, it } from "vitest";
import { getPreviewDrawRegion } from "./EditorRoot";

describe("getPreviewDrawRegion", () => {
  it("letterboxes in landscape mode", () => {
    const region = getPreviewDrawRegion(1920, 1080, 640, 360, "landscape");
    expect(region.drawWidth).toBe(640);
    expect(region.drawHeight).toBe(360);
    expect(region.offsetX).toBe(0);
    expect(region.offsetY).toBe(0);
  });

  it("crops the sides for portrait mobile mode", () => {
    const region = getPreviewDrawRegion(1920, 1080, 360, 640, "portrait-mobile");
    expect(region.drawHeight).toBe(640);
    expect(region.drawWidth).toBeCloseTo(1137.78, 1);
    expect(region.offsetX).toBeLessThan(0);
    expect(region.offsetY).toBe(0);
  });
});
