import { describe, expect, it } from "vitest";

import {
  WORLD_BUILDER_DEFAULTS,
  generateWorldBuilderHeights,
  resolveWorldBuilderParams
} from "./worldBuilderEffect";

describe("worldBuilderEffect", () => {
  it("generates deterministic heights for matching seeds", () => {
    const first = generateWorldBuilderHeights(16, 16, 10, 42);
    const second = generateWorldBuilderHeights(16, 16, 10, 42);

    expect(first).toEqual(second);
  });

  it("changes heights with a different seed", () => {
    const first = generateWorldBuilderHeights(16, 16, 10, 42);
    const second = generateWorldBuilderHeights(16, 16, 10, 99);

    expect(first).not.toEqual(second);
  });

  it("resolves defaults and clamps out-of-range params", () => {
    const resolved = resolveWorldBuilderParams({
      gridWidth: -2,
      gridDepth: 999,
      maxHeight: 999,
      voxelSize: 2,
      speed: 0,
      horizon: 1.5,
      audioReact: -1,
      beatKick: 10,
      seed: 3.7
    });

    expect(resolved.gridWidth).toBe(8);
    expect(resolved.gridDepth).toBe(34);
    expect(resolved.maxHeight).toBe(20);
    expect(resolved.voxelSize).toBe(8);
    expect(resolved.speed).toBe(0.03);
    expect(resolved.horizon).toBe(0.9);
    expect(resolved.audioReact).toBe(0);
    expect(resolved.beatKick).toBe(1.4);
    expect(resolved.seed).toBe(4);
  });

  it("uses defaults when params are omitted", () => {
    const resolved = resolveWorldBuilderParams({});

    expect(resolved).toEqual(WORLD_BUILDER_DEFAULTS);
  });
});
