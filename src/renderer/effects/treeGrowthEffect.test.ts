import { describe, expect, it, vi } from "vitest";

import { TreeGrowthEffect } from "./treeGrowthEffect";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createContext = () => {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    set lineCap(_value: CanvasLineCap) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {},
    set fillStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("TreeGrowthEffect", () => {
  it("skips drawing when growth is zero", () => {
    const effect = new TreeGrowthEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 120,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: 0 }
    });

    expect(ctx.stroke).not.toHaveBeenCalled();
  });

  it("draws branching strokes when fully grown", () => {
    const effect = new TreeGrowthEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 120,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: 1, levels: 5, seed: 2 }
    });

    expect(ctx.lineTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
