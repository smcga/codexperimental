import { describe, expect, it, vi } from "vitest";

import { SineDistorterEffect } from "./sineDistorter";

const baseAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0,
  bass: 0.2,
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

const createCanvasContext = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    strokeText: vi.fn(),
    fillText: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    set globalAlpha(_value: number) {},
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {},
    set font(_value: string) {},
    set textAlign(_value: CanvasTextAlign) {},
    set textBaseline(_value: CanvasTextBaseline) {}
  } as unknown as CanvasRenderingContext2D;
};

const createMainContext = () => {
  const ctx = createCanvasContext();
  const canvas = { width: 320, height: 180 } as HTMLCanvasElement;
  return {
    ...ctx,
    canvas
  } as CanvasRenderingContext2D;
};

const setupDocumentMock = () => {
  const canvasCtx = createCanvasContext();
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => canvasCtx)
  } as unknown as HTMLCanvasElement;
  const createElement = vi.fn(() => canvas);
  vi.stubGlobal("document", { createElement });
  return { createElement };
};

describe("SineDistorterEffect", () => {
  it("reuses cached canvases and responds to beats", () => {
    const { createElement } = setupDocumentMock();
    const effect = new SineDistorterEffect();
    const ctx = createMainContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio({ beat: true }),
      params: {}
    });

    const beatPulse = (effect as unknown as { beatPulse: number }).beatPulse;
    expect(beatPulse).toBeGreaterThan(0);
    expect(createElement).toHaveBeenCalledTimes(1);

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.1,
      delta: 0.016,
      audio: createAudio(),
      params: {}
    });

    expect(createElement).toHaveBeenCalledTimes(1);

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0.2,
      delta: 0.016,
      audio: createAudio(),
      params: { mode: "both" }
    });

    expect(createElement).toHaveBeenCalledTimes(2);
  });
});
