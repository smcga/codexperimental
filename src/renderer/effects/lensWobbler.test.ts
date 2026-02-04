import { describe, expect, it } from "vitest";

import { createLensTexture, TEXT_STAMP } from "./lensWobbler";

const textureIndex = (x: number, y: number, width: number) => (y * width + x) * 3;

describe("LensWobbler texture", () => {
  it("generates a deterministic texture with expected dimensions", () => {
    const texture = createLensTexture(0);

    expect(texture.width).toBe(256);
    expect(texture.height).toBe(256);
    expect(texture.data.length).toBe(256 * 256 * 3);
    expect(texture.data[textureIndex(8, 8, texture.width)]).toBeGreaterThan(10);
  });

  it("stamps the VGA WARP text into the texture", () => {
    const texture = createLensTexture(1);
    const idx = textureIndex(TEXT_STAMP.x, TEXT_STAMP.y, texture.width);

    expect(texture.data[idx]).toBeGreaterThan(200);
    expect(texture.data[idx + 1]).toBeGreaterThan(200);
  });
});
