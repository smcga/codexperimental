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
    translate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    set lineCap(_value: CanvasLineCap) {},
    set lineJoin(_value: CanvasLineJoin) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set fillStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("TreeGrowthEffect", () => {
  it("does not render when growth is zero", () => {
    const effect = new TreeGrowthEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { growthSpeed: 0 }
    });

    expect(ctx.lineTo).not.toHaveBeenCalled();
  });

  it("renders the expected number of branch segments when fully grown", () => {
    const effect = new TreeGrowthEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 10,
      delta: 0.016,
      audio: createAudio(),
      params: { growthSpeed: 1, branchLevels: 3, seed: 0, sway: 0 }
    });

    expect(ctx.lineTo).toHaveBeenCalledTimes(15);
  });
});
