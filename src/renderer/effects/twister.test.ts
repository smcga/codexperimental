import { describe, expect, it, vi } from "vitest";

import { TwisterEffect } from "./twister";

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

const createAudio = (overrides: Partial<ReturnType<typeof baseAudio>> = {}) => ({
  ...baseAudio(),
  ...overrides
});

const createContext = () =>
  ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    set fillStyle(_value: string) {},
    set globalAlpha(_value: number) {}
  }) as unknown as CanvasRenderingContext2D;

describe("TwisterEffect", () => {
  it("draws slices and responds to beats", () => {
    const effect = new TwisterEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 100,
      time: 1,
      delta: 0.016,
      audio: createAudio({ beat: true, bass: 0.4 }),
      params: { sliceH: 10 }
    });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect((effect as unknown as { beatPulse: number }).beatPulse).toBe(1);

    effect.render({
      ctx,
      width: 200,
      height: 100,
      time: 1.05,
      delta: 0.05,
      audio: createAudio(),
      params: { sliceH: 10 }
    });

    expect((effect as unknown as { beatPulse: number }).beatPulse).toBeLessThan(1);
  });

  it("treats x values between 0 and 1 as normalized width", () => {
    const effect = new TwisterEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 200,
      height: 10,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: {
        x: 0.5,
        baseWidth: 100,
        amplitude: 0,
        turns: 1,
        speed: 0,
        sliceH: 10,
        minWidthScale: 1,
        maxWidthScale: 1,
        background: "clear"
      }
    });

    const calls = (ctx.fillRect as unknown as { mock: { calls: Array<[number, number]> } }).mock.calls;
    const sliceCall = calls[1];
    expect(sliceCall[0]).toBeCloseTo(50, 2);
  });
});
