import { describe, expect, it, vi } from "vitest";

import {
  computeRainbowCatPosition,
  rainbowCatHash01,
  RainbowCatEffect,
  RAINBOW_CAT_DEFAULTS
} from "./rainbowCatEffect";

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
    stroke: vi.fn(),
    fillRect: vi.fn(),
    set lineCap(_value: CanvasLineCap) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {},
    set fillStyle(_value: string) {},
    set globalCompositeOperation(_value: GlobalCompositeOperation) {},
    set globalAlpha(_value: number) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("RainbowCatEffect", () => {
  it("keeps deterministic hash values within range", () => {
    expect(rainbowCatHash01(0)).toBeGreaterThanOrEqual(0);
    expect(rainbowCatHash01(0)).toBeLessThan(1);
    expect(rainbowCatHash01(12.34)).toBeCloseTo(0.8124, 4);
    expect(rainbowCatHash01(56.78)).toBeCloseTo(0.7037, 4);
  });

  it("computes a stable cat position and pixel size without teleporting", () => {
    const now = computeRainbowCatPosition({
      width: 320,
      height: 180,
      time: 1.25,
      speed: 0.9,
      bounce: 0.45,
      catScale: 1,
      audioLift: 0.2,
      seed: 3
    });
    const next = computeRainbowCatPosition({
      width: 320,
      height: 180,
      time: 1.266,
      speed: 0.9,
      bounce: 0.45,
      catScale: 1,
      audioLift: 0.2,
      seed: 3
    });

    expect(now.pixelSize).toBeCloseTo(2, 5);
    expect(now.x).toBeCloseTo(238.64, 2);
    expect(now.y).toBeCloseTo(92.11, 2);
    expect(Math.abs(next.x - now.x)).toBeLessThan(2);
    expect(Math.abs(next.y - now.y)).toBeLessThan(1.5);
  });

  it("covers a larger vertical range over time for a more dynamic arc", () => {
    const samples = [0, 0.5, 1, 1.5, 2, 2.5, 3].map((time) =>
      computeRainbowCatPosition({
        width: 320,
        height: 180,
        time,
        speed: 1,
        bounce: 0.8,
        catScale: 1,
        audioLift: 0.2,
        seed: 4
      }).y
    );

    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(22);
  });

  it("renders stars, rainbow stripes, and multiple stroke details for the cat silhouette", () => {
    const effect = new RainbowCatEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { ...RAINBOW_CAT_DEFAULTS }
    });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(180);
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1);
    expect(ctx.stroke.mock.calls.length).toBeGreaterThanOrEqual(4);
  });

  it("extends the trail when rainbowLength increases", () => {
    const effect = new RainbowCatEffect();
    const shortCtx = createContext();
    const longCtx = createContext();

    effect.render({
      ctx: shortCtx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { rainbowLength: 0.2, starDensity: 0, sparkle: 0, seed: 1 }
    });

    effect.render({
      ctx: longCtx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { rainbowLength: 1, starDensity: 0, sparkle: 0, seed: 1 }
    });

    expect(longCtx.fillRect.mock.calls.length).toBeGreaterThan(shortCtx.fillRect.mock.calls.length);
  });
});
