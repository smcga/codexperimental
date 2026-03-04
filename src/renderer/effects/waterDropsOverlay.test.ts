import { describe, expect, it, vi } from "vitest";

import { WATER_DROPS_OVERLAY_DEFAULTS, WaterDropsOverlayEffect } from "./waterDropsOverlay";

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
  const imageData = { data: new Uint8ClampedArray(24 * 24 * 4), width: 24, height: 24 } as ImageData;
  imageData.data.fill(120);

  return {
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height })),
    putImageData: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    set globalAlpha(_value: number) {},
    get globalAlpha() {
      return 1;
    },
    set lineWidth(_value: number) {},
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;
};

describe("WaterDropsOverlayEffect", () => {
  it("uses documented defaults", () => {
    expect(WATER_DROPS_OVERLAY_DEFAULTS).toEqual({
      density: 1,
      maxDrops: 80,
      speed: 1,
      distortion: 1,
      highlight: 1
    });
  });

  it("renders transparent droplets without clearing the canvas", () => {
    const effect = new WaterDropsOverlayEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: createAudio(),
      params: {}
    });

    expect(ctx.getImageData).toHaveBeenCalled();
    expect(ctx.putImageData).toHaveBeenCalled();
    expect((ctx as unknown as { clearRect?: unknown }).clearRect).toBeUndefined();
  });

  it("skips image sampling when maxDrops is zero", () => {
    const effect = new WaterDropsOverlayEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 1 / 60,
      audio: createAudio(),
      params: { maxDrops: 0 }
    });

    expect(ctx.getImageData).not.toHaveBeenCalled();
  });

  it("reinitializes droplets after reset", () => {
    const effect = new WaterDropsOverlayEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 120,
      height: 80,
      time: 0,
      delta: 1 / 60,
      audio: createAudio(),
      params: { maxDrops: 4 }
    });

    const firstCallCount = ctx.getImageData.mock.calls.length;
    effect.reset();

    effect.render({
      ctx,
      width: 120,
      height: 80,
      time: 0.5,
      delta: 1 / 60,
      audio: createAudio(),
      params: { maxDrops: 4 }
    });

    expect(ctx.getImageData.mock.calls.length).toBeGreaterThan(firstCallCount);
  });
});
