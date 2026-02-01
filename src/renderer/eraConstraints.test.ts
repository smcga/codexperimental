import { describe, expect, it } from "vitest";

import { C64_PALETTE, getEraConstraints, quantizeToPalette } from "./eraConstraints";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;

describe("getEraConstraints", () => {
  it("returns low-resolution settings for 8bit", () => {
    const constraints = getEraConstraints("8bit", BASE_WIDTH, BASE_HEIGHT);
    expect(constraints.renderWidth).toBe(240);
    expect(constraints.renderHeight).toBe(135);
    expect(constraints.palette).toBe(C64_PALETTE);
    expect(constraints.smoothing).toBe(false);
  });

  it("uses a higher internal resolution for 16bit", () => {
    const constraints = getEraConstraints("16bit", BASE_WIDTH, BASE_HEIGHT);
    expect(constraints.renderWidth).toBe(480);
    expect(constraints.renderHeight).toBe(270);
    expect(constraints.smoothing).toBe(false);
  });
});

describe("quantizeToPalette", () => {
  it("maps pixels to the nearest palette color", () => {
    const palette: Array<[number, number, number]> = [
      [0, 0, 0],
      [255, 255, 255]
    ];
    const data = new Uint8ClampedArray([200, 200, 200, 255]);
    quantizeToPalette(data, palette);
    expect(Array.from(data)).toEqual([255, 255, 255, 255]);
  });
});
