import { describe, expect, it } from "vitest";

import {
  buildFractureCacheKey,
  buildRecursiveFractureTree,
  createFracturePrng,
  RECURSIVE_FRACTURE_DEFAULTS,
  resolveRecursiveFractureParams,
  summarizeFractureTree
} from "./recursiveFracture";

describe("recursiveFracture helpers", () => {
  it("produces deterministic PRNG sequences", () => {
    const a = createFracturePrng(42);
    const b = createFracturePrng(42);
    const seqA = Array.from({ length: 6 }, () => Number(a().toFixed(6)));
    const seqB = Array.from({ length: 6 }, () => Number(b().toFixed(6)));
    expect(seqA).toEqual(seqB);
  });

  it("builds a stable cache key for identical params", () => {
    const params = resolveRecursiveFractureParams(RECURSIVE_FRACTURE_DEFAULTS as unknown as Record<string, unknown>);
    const keyA = buildFractureCacheKey(1280, 720, params);
    const keyB = buildFractureCacheKey(1280, 720, params);
    const keyC = buildFractureCacheKey(1280, 720, { ...params, seed: params.seed + 1 });
    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it("generates deterministic tree summaries for same seed", () => {
    const params = resolveRecursiveFractureParams({
      ...RECURSIVE_FRACTURE_DEFAULTS,
      seed: 11,
      shapeCount: 3,
      maxDepth: 5
    } as Record<string, unknown>);

    const treeA = buildRecursiveFractureTree(960, 540, params);
    const treeB = buildRecursiveFractureTree(960, 540, params);
    const treeC = buildRecursiveFractureTree(960, 540, { ...params, seed: 12 });

    const summaryA = summarizeFractureTree(treeA);
    const summaryB = summarizeFractureTree(treeB);

    expect(summaryA).toEqual(summaryB);
    expect(summaryA.nodeCount).toBeGreaterThan(8);
    expect(treeA[0]?.center).not.toEqual(treeC[0]?.center);
  });
});
