import { describe, expect, it, vi } from "vitest";

import { GlassEffect, glassHash, resolveGlassParams } from "./glassEffect";

const createAudio = (overrides: Partial<ReturnType<typeof baseAudio>> = {}) => ({
  ...baseAudio(),
  ...overrides
});

const baseAudio = () => ({
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

const createGradient = () => ({
  addColorStop: vi.fn()
}) as unknown as CanvasGradient;

const createContext = () => ({
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  quadraticCurveTo: vi.fn(),
  ellipse: vi.fn(),
  createLinearGradient: vi.fn(() => createGradient()),
  set fillStyle(_value: string | CanvasGradient) {},
  set strokeStyle(_value: string | CanvasGradient) {},
  set lineWidth(_value: number) {},
  set globalCompositeOperation(_value: GlobalCompositeOperation) {}
}) as unknown as CanvasRenderingContext2D;

describe("GlassEffect", () => {
  it("produces deterministic hash values", () => {
    expect(glassHash(1.25)).toBeCloseTo(0.3517, 4);
    expect(glassHash(9.5)).toBeCloseTo(0.5265, 4);
  });

  it("clamps and resolves params", () => {
    const params = resolveGlassParams({
      paneCount: 50,
      bevel: -1,
      wobble: 3,
      shimmer: 8,
      frost: -4,
      tint: 280,
      crackle: 2,
      refraction: -2,
      audioReact: 4,
      seed: 3
    });

    expect(params.paneCount).toBe(36);
    expect(params.bevel).toBe(0);
    expect(params.wobble).toBe(1);
    expect(params.shimmer).toBe(1);
    expect(params.frost).toBe(0);
    expect(params.tint).toBe(230);
    expect(params.crackle).toBe(1);
    expect(params.refraction).toBe(0);
    expect(params.audioReact).toBe(1);
    expect(params.seed).toBe(3);
  });

  it("draws layered shards, frost, and caustics", () => {
    const effect = new GlassEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.75,
      delta: 0.016,
      audio: createAudio({ rms: 0.6, treble: 0.4, beat: true }),
      params: { paneCount: 8, frost: 0.9, crackle: 0.7, refraction: 0.8, seed: 2 }
    });

    expect(ctx.createLinearGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 180);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalled();
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
});
