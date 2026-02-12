import { describe, expect, it } from "vitest";
import { fitPreviewViewport, getPreviewViewport, PREVIEW_VIEWPORTS } from "./previewViewport";

describe("previewViewport", () => {
  it("returns desktop viewport metadata", () => {
    expect(getPreviewViewport("desktop")).toEqual({
      label: "Desktop (16:9)",
      width: 1280,
      height: 720
    });
  });

  it("returns mobile viewport metadata", () => {
    expect(getPreviewViewport("mobile")).toEqual({
      label: "Mobile (390×844)",
      width: 390,
      height: 844
    });
  });

  it("keeps mobile viewport in portrait orientation", () => {
    expect(PREVIEW_VIEWPORTS.mobile.height).toBeGreaterThan(PREVIEW_VIEWPORTS.mobile.width);
  });

  it("fits desktop viewport into available preview space without distortion", () => {
    expect(fitPreviewViewport(1280, 720, 560, 360)).toEqual({ width: 560, height: 315 });
  });

  it("fits mobile viewport into available preview space without distortion", () => {
    expect(fitPreviewViewport(390, 844, 560, 360)).toEqual({ width: 166, height: 360 });
  });
});
