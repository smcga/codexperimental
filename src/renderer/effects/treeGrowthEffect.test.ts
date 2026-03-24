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
    quadraticCurveTo: vi.fn(),
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

  it("draws many branching curves and leaves when fully grown", () => {
    const effect = new TreeGrowthEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 120,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: 1, levels: 7, seed: 2 }
    });

    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo.mock.calls.length).toBeGreaterThan(30);
  });

  it("resets the automatic growth cycle back to a sapling", () => {
    const effect = new TreeGrowthEffect();
    effect.render({
      ctx: createContext(),
      width: 240,
      height: 160,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.22, levels: 8, seed: 1.5 }
    });

    const grownCtx = createContext();

    effect.render({
      ctx: grownCtx,
      width: 240,
      height: 160,
      time: 24,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.22, levels: 8, seed: 1.5 }
    });

    expect(grownCtx.stroke).toHaveBeenCalled();

    effect.reset();

    const resetCtx = createContext();
    effect.render({
      ctx: resetCtx,
      width: 240,
      height: 160,
      time: 24,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.22, levels: 8, seed: 1.5 }
    });

    expect(resetCtx.stroke).not.toHaveBeenCalled();
  });
});
