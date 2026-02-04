import { describe, expect, it } from "vitest";

import { SineScrollerLogoEffect } from "./sineScrollerLogo";

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
    fillRect: () => undefined,
    fillText: () => undefined,
    drawImage: () => undefined,
    measureText: () => ({ width: 12 }),
    save: () => undefined,
    restore: () => undefined,
    clearRect: () => undefined,
    set fillStyle(_value: string) {},
    set font(_value: string) {},
    set textBaseline(_value: CanvasTextBaseline) {},
    set textAlign(_value: CanvasTextAlign) {},
    set globalAlpha(_value: number) {}
  }) as unknown as CanvasRenderingContext2D;

describe("SineScrollerLogoEffect", () => {
  it("advances the scroller and records beat pulses", () => {
    const effect = new SineScrollerLogoEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio({ beat: true }),
      params: {},
      era: "16bit"
    });

    const beatPulse = (effect as unknown as { beatPulse: number }).beatPulse;
    expect(beatPulse).toBeGreaterThan(0);

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.1,
      delta: 0.016,
      audio: createAudio(),
      params: {},
      era: "16bit"
    });

    const scrollX = (effect as unknown as { scrollX: number }).scrollX;
    expect(scrollX).toBeLessThan(0);
  });
});
