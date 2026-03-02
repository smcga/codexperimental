import { describe, expect, it } from "vitest";
import { getPreviewDrawRegion } from "./previewFraming";

describe("getPreviewDrawRegion", () => {
  it("fits landscape source into preview canvas in landscape mode", () => {
    const region = getPreviewDrawRegion(1920, 1080, 640, 360, "landscape");

    expect(region).toEqual({
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 1920,
      sourceHeight: 1080,
      destX: 0,
      destY: 0,
      destWidth: 640,
      destHeight: 360
    });
  });

  it("centres a portrait mobile frame inside the preview canvas", () => {
    const region = getPreviewDrawRegion(1920, 1080, 640, 360, "portrait-mobile");

    expect(region.destWidth).toBeCloseTo(202.5, 1);
    expect(region.destHeight).toBeCloseTo(360, 1);
    expect(region.destX).toBeCloseTo((640 - 202.5) / 2, 1);
    expect(region.destY).toBe(0);
  });

  it("crops landscape source to portrait mobile aspect from the centre", () => {
    const region = getPreviewDrawRegion(1920, 1080, 640, 360, "portrait-mobile");

    expect(region.sourceWidth).toBeCloseTo(607.5, 1);
    expect(region.sourceHeight).toBe(1080);
    expect(region.sourceX).toBeCloseTo((1920 - 607.5) / 2, 1);
    expect(region.sourceY).toBe(0);
  });
});
