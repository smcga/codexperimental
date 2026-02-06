import { describe, expect, it } from "vitest";
import { hash1, platformAt } from "./platformerScroll";

describe("platformerScroll helpers", () => {
  it("hash1 is deterministic for the same index/seed", () => {
    const a = hash1(42, 1337);
    const b = hash1(42, 1337);

    expect(a).toBe(b);
  });

  it("hash1 stays in [0, 1)", () => {
    for (let i = -25; i <= 25; i += 1) {
      const value = hash1(i, 77);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("platformAt is deterministic for fixed inputs", () => {
    const sampleA = platformAt(128, 1337, 0.55, 5);
    const sampleB = platformAt(128, 1337, 0.55, 5);

    expect(sampleA).toEqual(sampleB);
  });

  it("platformAt bounds ySteps and length fields", () => {
    for (let col = -64; col <= 64; col += 1) {
      const platform = platformAt(col, 9001, 0.65, 4);
      expect(platform.ySteps).toBeGreaterThanOrEqual(0);
      expect(platform.ySteps).toBeLessThanOrEqual(4);
      expect(platform.lengthCols).toBeGreaterThanOrEqual(0);
      expect(platform.lengthCols).toBeLessThanOrEqual(5);
    }
  });
});
