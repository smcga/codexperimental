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
    bezierCurveTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
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

  it("draws dense branch and canopy geometry when fully grown", () => {
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

    expect(ctx.bezierCurveTo).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.bezierCurveTo.mock.calls.length).toBeGreaterThan(30);
    expect(ctx.arc.mock.calls.length).toBeGreaterThan(20);
  });

  it("keeps trunk and branches present across seasonal year wrap in auto mode", () => {
    const effect = new TreeGrowthEffect();

    effect.render({
      ctx: createContext(),
      width: 260,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.12, levels: 8, seed: 3 }
    });

    const lateYearCtx = createContext();
    effect.render({
      ctx: lateYearCtx,
      width: 260,
      height: 180,
      time: 58,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.12, levels: 8, seed: 3 }
    });

    const nextYearCtx = createContext();
    effect.render({
      ctx: nextYearCtx,
      width: 260,
      height: 180,
      time: 67,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.12, levels: 8, seed: 3 }
    });

    expect(lateYearCtx.stroke).toHaveBeenCalled();
    expect(nextYearCtx.stroke).toHaveBeenCalled();
  });

  it("adds visible year markers over time in auto mode", () => {
    const effect = new TreeGrowthEffect();

    const yearZeroCtx = createContext();
    effect.render({
      ctx: yearZeroCtx,
      width: 280,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.12, levels: 8, seed: 1 }
    });

    const laterCtx = createContext();
    effect.render({
      ctx: laterCtx,
      width: 280,
      height: 180,
      time: 40,
      delta: 0.016,
      audio: createAudio(),
      params: { growth: -1, speed: 0.12, levels: 8, seed: 1 }
    });

    expect(yearZeroCtx.ellipse).not.toHaveBeenCalled();
    expect(laterCtx.ellipse).toHaveBeenCalled();
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
