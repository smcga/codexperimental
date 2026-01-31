import { describe, expect, it } from "vitest";

import { computeLetterbox } from "./letterbox";

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
