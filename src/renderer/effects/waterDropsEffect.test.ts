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
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
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
      minRadius: 0,
      maxRadius: 600,
      distortion: 3,
      trail: -2,
      audioReact: 8,
      tint: 500,
      refraction: 2,
      microDrops: -1,
      rivulets: 4,
      seed: 9
    });

    expect(params.dropCount).toBe(8);
    expect(params.minRadius).toBe(1);
    expect(params.maxRadius).toBe(120);
    expect(params.distortion).toBe(1);
    expect(params.trail).toBe(0);
    expect(params.audioReact).toBe(1);
    expect(params.tint).toBe(230);
    expect(params.refraction).toBe(1);
    expect(params.microDrops).toBe(0);
    expect(params.rivulets).toBe(1);
    expect(params.seed).toBe(9);
  });

  it("draws droplet arcs, micro drops, and curved trails", () => {
    const effect = new WaterDropsEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { dropCount: 10, trail: 1, microDrops: 1, rivulets: 1, seed: 1 }
    });

    expect(ctx.arc.mock.calls.length).toBeGreaterThan(40);
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
  });


  it("adds a full-frame mist pass at the end", () => {
    const effect = new WaterDropsEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { dropCount: 8, trail: 0, rivulets: 0, microDrops: 0, seed: 3 }
    });

    const lastArc = ctx.arc.mock.calls.at(-1);
    expect(lastArc?.[0]).toBe(160);
    expect(lastArc?.[1]).toBe(90);
    expect(lastArc?.[2]).toBeCloseTo(249.6, 5);
    expect(lastArc?.[3]).toBe(0);
    expect(lastArc?.[4]).toBe(Math.PI * 2);
  });

  it("omits droplet trails and rivulets when disabled", () => {
    const effect = new WaterDropsEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { dropCount: 10, trail: 0, rivulets: 0, microDrops: 0, seed: 1 }
    });

    expect(ctx.quadraticCurveTo).not.toHaveBeenCalled();
  });
});
