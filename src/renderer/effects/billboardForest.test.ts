import { describe, expect, it } from "vitest";
import { createMulberry32, generateForestTrees, projectBillboard } from "./billboardForest";

describe("billboardForest helpers", () => {
  it("creates deterministic trees from seed", () => {
    const a = generateForestTrees(42, 8, 100, 3);
    const b = generateForestTrees(42, 8, 100, 3);
    expect(a).toEqual(b);
  });

  it("creates deterministic mulberry32 sequence", () => {
    const randomA = createMulberry32(123);
    const randomB = createMulberry32(123);
    const seqA = [randomA(), randomA(), randomA(), randomA()];
    const seqB = [randomB(), randomB(), randomB(), randomB()];
    expect(seqA).toEqual(seqB);
  });

  it("projects nearer trees larger and lower on screen", () => {
    const far = projectBillboard(10, 2.4, 1280, 720, 340, 420, 360);
    const near = projectBillboard(10, 0.9, 1280, 720, 340, 420, 360);
    expect(near.size).toBeGreaterThan(far.size);
    expect(near.y).toBeGreaterThan(far.y);
  });
});
