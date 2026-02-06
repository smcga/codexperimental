import { describe, expect, it } from "vitest";

import { C64_PALETTE, getEraConstraints, quantizeToPalette } from "./eraConstraints";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 180;

describe("getEraConstraints", () => {
  it("returns low-resolution settings for 8bit", () => {
    const constraints = getEraConstraints("8bit", BASE_WIDTH, BASE_HEIGHT);
    expect(constraints.renderWidth).toBe(288);
    expect(constraints.renderHeight).toBe(162);
    expect(constraints.palette).toBe(C64_PALETTE);
    expect(constraints.smoothing).toBe(false);
  });

  it("uses a higher internal resolution for 16bit", () => {
    const constraints = getEraConstraints("16bit", BASE_WIDTH, BASE_HEIGHT);
    expect(constraints.renderWidth).toBe(560);
    expect(constraints.renderHeight).toBe(315);
    expect(constraints.smoothing).toBe(false);
  });

  it("upscales later eras for extra clarity", () => {
    const ps1 = getEraConstraints("ps1", BASE_WIDTH, BASE_HEIGHT);
    const pcdemo = getEraConstraints("pcdemo", BASE_WIDTH, BASE_HEIGHT);
    const future = getEraConstraints("future", BASE_WIDTH, BASE_HEIGHT);

    expect(ps1.renderWidth).toBe(400);
    expect(ps1.renderHeight).toBe(225);
    expect(pcdemo.renderWidth).toBe(432);
    expect(pcdemo.renderHeight).toBe(243);
    expect(future.renderWidth).toBe(480);
    expect(future.renderHeight).toBe(270);
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
