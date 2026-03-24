import { describe, expect, it } from "vitest";

import {
  clampDoodleBrushSize,
  DEFAULT_DOODLE_BRUSH_COLOR,
  DEFAULT_DOODLE_BRUSH_SIZE,
  getDoodleBrushSizeLabel,
  normalizeDoodleBrushColor
} from "./doodleComposer";

describe("doodleComposer", () => {
  it("clamps brush sizes into the supported range", () => {
    expect(clampDoodleBrushSize(-1)).toBe(2);
    expect(clampDoodleBrushSize(7.6)).toBe(8);
    expect(clampDoodleBrushSize(80)).toBe(24);
    expect(clampDoodleBrushSize(Number.NaN)).toBe(DEFAULT_DOODLE_BRUSH_SIZE);
  });

  it("normalizes unsupported brush colors back to the default swatch", () => {
    expect(normalizeDoodleBrushColor(" #FF7BD5 ")).toBe("#ff7bd5");
    expect(normalizeDoodleBrushColor("#123456")).toBe(DEFAULT_DOODLE_BRUSH_COLOR);
    expect(normalizeDoodleBrushColor(undefined)).toBe(DEFAULT_DOODLE_BRUSH_COLOR);
  });

  it("maps brush sizes to human-readable labels", () => {
    expect(getDoodleBrushSizeLabel(2)).toBe("Small");
    expect(getDoodleBrushSizeLabel(8)).toBe("Medium");
    expect(getDoodleBrushSizeLabel(20)).toBe("Large");
  });
});
