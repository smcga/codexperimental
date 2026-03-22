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

  it("computes a stable cat position and pixel size", () => {
    const position = computeRainbowCatPosition({
      width: 320,
      height: 180,
      time: 1.25,
      speed: 0.9,
      bounce: 0.45,
      catScale: 1,
      audioLift: 0.2
    });

    expect(position.pixelSize).toBeCloseTo(2, 5);
    expect(position.x).toBeCloseTo(151.2, 3);
    expect(position.bob).toBeCloseTo(-0.49, 2);
    expect(position.y).toBeCloseTo(89.51, 2);
  });

  it("renders stars, rainbow stripes, and the cat body", () => {
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
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(140);
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(1);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
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
      params: { rainbowLength: 0.2, starDensity: 0, sparkle: 0 }
    });

    effect.render({
      ctx: longCtx,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { rainbowLength: 1, starDensity: 0, sparkle: 0 }
    });

    expect(longCtx.fillRect.mock.calls.length).toBeGreaterThan(shortCtx.fillRect.mock.calls.length);
  });
});
