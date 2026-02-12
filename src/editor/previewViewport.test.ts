import { describe, expect, it } from "vitest";
import { getEditorPreviewViewport } from "./previewViewport";

describe("getEditorPreviewViewport", () => {
  it("returns the default 16:9 desktop viewport", () => {
    expect(getEditorPreviewViewport("desktop")).toEqual({
      width: 640,
      height: 360,
      aspectRatio: "16 / 9"
    });
  });

  it("returns a portrait mobile viewport", () => {
    expect(getEditorPreviewViewport("mobile")).toEqual({
      width: 360,
      height: 640,
      aspectRatio: "9 / 16"
    });
  });
});
