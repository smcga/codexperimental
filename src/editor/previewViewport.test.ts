import { describe, expect, it } from "vitest";
import { getPreviewViewport, PREVIEW_VIEWPORTS } from "./previewViewport";

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
});
