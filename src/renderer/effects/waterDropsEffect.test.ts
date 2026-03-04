import { describe, expect, it, vi } from "vitest";

import { WaterDropsEffect, hashFloat, resolveWaterDropsParams } from "./waterDropsEffect";

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

const createContext = () => ({
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  set fillStyle(_value: string) {},
  set strokeStyle(_value: string) {},
  set lineWidth(_value: number) {}
}) as unknown as CanvasRenderingContext2D;

describe("WaterDropsEffect", () => {
  it("produces deterministic hash values", () => {
    expect(hashFloat(12.5)).toBeCloseTo(0.0864, 4);
    expect(hashFloat(42.25)).toBeCloseTo(0.2064, 4);
  });

  it("clamps and resolves params", () => {
    const params = resolveWaterDropsParams({
      dropCount: 3,
      minRadius: 1,
      maxRadius: 600,
      distortion: 3,
      trail: -2,
      audioReact: 8,
      tint: 500,
      seed: 9
    });

    expect(params.dropCount).toBe(8);
    expect(params.minRadius).toBe(2);
    expect(params.maxRadius).toBe(120);
    expect(params.distortion).toBe(1);
    expect(params.trail).toBe(0);
    expect(params.audioReact).toBe(1);
    expect(params.tint).toBe(230);
    expect(params.seed).toBe(9);
  });

  it("draws expected primitives based on drop count and trail setting", () => {
    const effect = new WaterDropsEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { dropCount: 10, trail: 1, seed: 1 }
    });

    expect(ctx.fillRect).toHaveBeenCalledTimes(1);
    expect(ctx.arc).toHaveBeenCalledTimes(30);
    expect(ctx.moveTo).toHaveBeenCalledTimes(10);
    expect(ctx.lineTo).toHaveBeenCalledTimes(10);
  });

  it("skips trail path when trail is zero", () => {
    const effect = new WaterDropsEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { dropCount: 10, trail: 0, seed: 1 }
    });

    expect(ctx.moveTo).not.toHaveBeenCalled();
    expect(ctx.lineTo).not.toHaveBeenCalled();
  });
});
