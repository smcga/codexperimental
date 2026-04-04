import { describe, expect, it } from "vitest";

import {
  applyChromaticAberrationToData,
  CHROMATIC_ABERRATION_DEFAULTS,
  resolveChromaticAberrationParams
} from "./chromaticAberration";

describe("resolveChromaticAberrationParams", () => {
  it("clamps unsafe values and falls back to rgb mode", () => {
    const resolved = resolveChromaticAberrationParams({
      strength: 3,
      falloff: -2,
      angle: 9,
      centerX: -5,
      centerY: 4,
      sampleStep: 0.2,
      alpha: 2,
      animate: 99,
      edgeBoost: -1,
      mode: "bogus"
    });

    expect(resolved).toEqual({
      strength: 0.08,
      falloff: 0.2,
      angle: Math.PI,
      centerX: 0,
      centerY: 1,
      sampleStep: 1,
      alpha: 1,
      animate: 4,
      edgeBoost: 0,
      mode: "rgb"
    });
  });
});

describe("applyChromaticAberrationToData", () => {
  it("keeps center pixel unchanged when radial distance is zero", () => {
    const width = 3;
    const height = 1;
    const source = new Uint8ClampedArray([
      255, 10, 1, 255,
      120, 140, 160, 255,
      2, 30, 240, 255
    ]);
    const output = new Uint8ClampedArray(source.length);

    const params = resolveChromaticAberrationParams({
      ...CHROMATIC_ABERRATION_DEFAULTS,
      strength: 0.05,
      falloff: 1,
      centerX: 0.5,
      centerY: 0,
      mode: "rgb"
    });

    applyChromaticAberrationToData(source, output, width, height, 0, params);

    expect(Array.from(output.slice(4, 8))).toEqual([120, 140, 160, 255]);
  });

  it("applies sampleStep as block fill", () => {
    const width = 4;
    const height = 2;
    const source = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < source.length; i += 4) {
      source[i] = i;
      source[i + 1] = 100;
      source[i + 2] = 200;
      source[i + 3] = 255;
    }

    const output = new Uint8ClampedArray(source.length);
    const params = resolveChromaticAberrationParams({
      strength: 0,
      sampleStep: 2,
      mode: "rgb"
    });

    applyChromaticAberrationToData(source, output, width, height, 0, params);

    expect(Array.from(output.slice(0, 4))).toEqual(Array.from(output.slice(4, 8)));
    expect(Array.from(output.slice(0, 4))).toEqual(Array.from(output.slice(width * 4, width * 4 + 4)));
  });
});
