import { describe, expect, it } from "vitest";

import { computeLetterbox, getContentRect, screenToContentNorm } from "./letterbox";

describe("computeLetterbox", () => {
  it("uses cover scaling in portrait to fill the height", () => {
    const result = computeLetterbox(360, 640, 320, 180);

    expect(result.scale).toBeCloseTo(640 / 180, 4);
    expect(result.offsetY).toBeCloseTo(0, 4);
    expect(result.offsetX).toBeLessThan(0);
  });

  it("uses contain scaling in landscape to avoid cropping", () => {
    const result = computeLetterbox(800, 360, 320, 180);

    expect(result.scale).toBeCloseTo(2, 4);
    expect(result.offsetX).toBeCloseTo(80, 4);
    expect(result.offsetY).toBeCloseTo(0, 4);
  });
});

describe("getContentRect", () => {
  it("returns the draw rect using letterbox scaling", () => {
    const rect = getContentRect(800, 360, 320, 180);

    expect(rect.scale).toBeCloseTo(2, 4);
    expect(rect.x).toBeCloseTo(80, 4);
    expect(rect.y).toBeCloseTo(0, 4);
    expect(rect.width).toBeCloseTo(640, 4);
    expect(rect.height).toBeCloseTo(360, 4);
  });
});

describe("screenToContentNorm", () => {
  it("maps points inside the content rect to normalized space", () => {
    const rect = getContentRect(800, 360, 320, 180);

    const result = screenToContentNorm(80, 0, rect);
    expect(result.inside).toBe(true);
    expect(result.x).toBeCloseTo(0, 4);
    expect(result.y).toBeCloseTo(0, 4);

    const center = screenToContentNorm(80 + rect.width / 2, rect.height / 2, rect);
    expect(center.inside).toBe(true);
    expect(center.x).toBeCloseTo(0.5, 4);
    expect(center.y).toBeCloseTo(0.5, 4);
  });

  it("flags points outside the content rect", () => {
    const rect = getContentRect(800, 360, 320, 180);
    const result = screenToContentNorm(0, 0, rect);
    expect(result.inside).toBe(false);
  });
});
