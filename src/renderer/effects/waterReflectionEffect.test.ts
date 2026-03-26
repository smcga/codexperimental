import { describe, expect, it, vi } from "vitest";

import {
  WaterReflectionEffect,
  buildRippleField,
  hashFloat,
  resolveWaterReflectionParams,
  sampleReflectionBand
} from "./waterReflectionEffect";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.4,
  bass: 0,
  mid: 0,
  treble: 0.35,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createGradient = () => ({
  addColorStop: vi.fn()
});

const createContext = () => {
  const canvas = { width: 320, height: 180 } as HTMLCanvasElement;
  return {
    canvas,
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    stroke: vi.fn(),
    ellipse: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    createLinearGradient: vi.fn(createGradient),
    set fillStyle(_value: string | CanvasGradient) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {}
  } as unknown as CanvasRenderingContext2D;
};

describe("WaterReflectionEffect", () => {
  it("produces deterministic hash values", () => {
    expect(hashFloat(12.5)).toBeCloseTo(0.0061, 4);
    expect(hashFloat(42.25)).toBeCloseTo(0.9859, 4);
  });

  it("clamps and resolves params", () => {
    const params = resolveWaterReflectionParams({
      rippleAmp: -2,
      rippleFreq: 99,
      rippleSpeed: -1,
      shimmer: 5,
      chop: -5,
      tint: 999,
      opacity: 0,
      audioReact: 9,
      seed: 17
    });

    expect(params).toEqual({
      rippleAmp: 0,
      rippleFreq: 8,
      rippleSpeed: 0,
      shimmer: 1,
      chop: 0,
      tint: 230,
      opacity: 0.15,
      audioReact: 1,
      seed: 17
    });
  });

  it("builds a deterministic ripple field", () => {
    const ripplesA = buildRippleField(7, 4, 320, 120, 60);
    const ripplesB = buildRippleField(7, 4, 320, 120, 60);

    expect(ripplesA).toEqual(ripplesB);
    expect(ripplesA[0]?.y).toBeGreaterThanOrEqual(120);
    expect(ripplesA[0]?.y).toBeLessThanOrEqual(180);
  });

  it("samples distorted reflection bands inside the mirrored source area", () => {
    const params = resolveWaterReflectionParams({});
    const emitters = buildRippleField(7, 4, 320, 120, 60);
    const band = sampleReflectionBand({
      y: 150,
      width: 320,
      reflectionTop: 120,
      reflectionHeight: 60,
      time: 1.25,
      audioRms: 0.4,
      params,
      emitters
    });

    expect(band.sourceY).toBeGreaterThanOrEqual(0);
    expect(band.sourceY).toBeLessThan(120);
    expect(band.alpha).toBeGreaterThan(0);
    expect(Math.abs(band.offsetX)).toBeGreaterThan(0);
  });

  it("renders clipped reflection bands across the bottom third", () => {
    const effect = new WaterReflectionEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.75,
      delta: 0.016,
      audio: createAudio(),
      params: { seed: 3, rippleAmp: 10, shimmer: 0.7, chop: 0.5 }
    });

    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(0, 120, 320, 60);
    expect(ctx.clip).toHaveBeenCalled();
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});
