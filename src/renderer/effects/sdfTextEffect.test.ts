import { describe, expect, it } from "vitest";

import { buildSignedDistanceField, createSdfCacheKey, layoutTextBlock, resolveSdfTextParams, shadeFieldToImageData } from "./sdfTextEffect";

describe("sdfTextEffect helpers", () => {
  it("computes multiline layout dimensions", () => {
    const widths = new Map([
      ["HELLO", 120],
      ["WORLD", 150]
    ]);
    const layout = layoutTextBlock((line) => widths.get(line) ?? 0, "HELLO\nWORLD", 64, 0.2);

    expect(layout.lines).toEqual(["HELLO", "WORLD"]);
    expect(layout.textBlockWidth).toBe(150);
    expect(layout.textBlockHeight).toBeCloseTo(140.8, 4);
  });

  it("creates a stable cache key for identical shape/layout inputs", () => {
    const base = resolveSdfTextParams({ text: "SDF", fieldResolution: 256, maxFieldResolution: 512, glowAlpha: 0.1 });
    const changedColor = resolveSdfTextParams({ text: "SDF", fieldResolution: 256, maxFieldResolution: 512, glowAlpha: 0.9 });

    expect(createSdfCacheKey(base, 1280, 720)).toBe(createSdfCacheKey(changedColor, 1280, 720));
  });

  it("builds signed distance fields with expected output dimensions", () => {
    const width = 8;
    const height = 6;
    const mask = new Uint8ClampedArray(width * height);
    mask[width * 2 + 2] = 255;
    mask[width * 2 + 3] = 255;
    mask[width * 3 + 2] = 255;
    mask[width * 3 + 3] = 255;

    const sdf = buildSignedDistanceField(mask, width, height);

    expect(sdf).toHaveLength(width * height);
    expect(sdf[width * 2 + 2]).toBeLessThan(0);
    expect(sdf[0]).toBeGreaterThan(0);
  });

  it("shades the field into image data", () => {
    const width = 4;
    const height = 4;
    const signed = new Float32Array(width * height).fill(2);
    signed[5] = -1;
    signed[6] = -1;
    const resolved = resolveSdfTextParams({});

    const image = shadeFieldToImageData(
      signed,
      width,
      height,
      resolved,
      { rms: 0.2, beatStrength: 0.3, beat: false, bass: 0, mid: 0, treble: 0, impactStrength: 0 },
      0,
      "pcdemo"
    );

    expect(image.width).toBe(width);
    expect(image.height).toBe(height);
    expect(image.data.some((value) => value > 0)).toBe(true);
  });
});
