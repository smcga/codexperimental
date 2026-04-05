import { describe, expect, test } from "vitest";
import { H, W, applyExplicit } from "../src/generated/explicitPixelsFrame";

function sample(data: Uint8ClampedArray, x: number, y: number): [number, number, number] {
  const idx = (y * W + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

describe("explicit pixels generated image traits", () => {
  test("looks like a concert-frame plate with bright center and dark crowd edges", () => {
    const data = new Uint8ClampedArray(W * H * 4);
    applyExplicit(data);

    const center = sample(data, Math.floor(W * 0.5), Math.floor(H * 0.5));
    const topLeft = sample(data, 2, 2);
    const topRight = sample(data, W - 3, 2);
    const bottomCenter = sample(data, Math.floor(W * 0.5), H - 3);

    const centerBrightness = center[0] + center[1] + center[2];
    const topLeftBrightness = topLeft[0] + topLeft[1] + topLeft[2];
    const topRightBrightness = topRight[0] + topRight[1] + topRight[2];
    const bottomBrightness = bottomCenter[0] + bottomCenter[1] + bottomCenter[2];

    expect(centerBrightness).toBeGreaterThan(700);
    expect(topLeftBrightness).toBeLessThan(290);
    expect(topRightBrightness).toBeLessThan(290);
    expect(bottomBrightness).toBeLessThan(300);

    const sideNeon = sample(data, 6, Math.floor(H * 0.5));
    expect(sideNeon[2]).toBeGreaterThan(80);
  });
});
