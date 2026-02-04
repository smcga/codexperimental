import { describe, expect, it, vi } from "vitest";

import { ShadebobsBobsEffect } from "./shadebobsBobs";

const createAudio = () => ({
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

const createContext = () =>
  ({
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    clip: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    set globalCompositeOperation(_value: GlobalCompositeOperation) {},
    set fillStyle(_value: string | CanvasGradient | CanvasPattern) {},
    set globalAlpha(_value: number) {},
    set imageSmoothingEnabled(_value: boolean) {}
  }) as unknown as CanvasRenderingContext2D;

const stubDocument = (ctx: CanvasRenderingContext2D) => {
  const canvas = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ctx)
  };
  return {
    createElement: vi.fn(() => canvas)
  } as unknown as Document;
};

describe("ShadebobsBobsEffect", () => {
  it("clamps mover counts and seeds deterministically", () => {
    const ctx = createContext();
    const originalDocument = globalThis.document;
    Object.defineProperty(globalThis, "document", {
      value: stubDocument(ctx),
      configurable: true
    });

    const effect = new ShadebobsBobsEffect();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { shadeCount: 2, bobCount: 200, seed: 3 }
    });

    const state = effect as unknown as { positionsX: Float32Array };
    expect(state.positionsX.length).toBe(140);
    const firstX = state.positionsX[0];

    effect.reset();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { shadeCount: 2, bobCount: 200, seed: 3 }
    });

    const nextState = effect as unknown as { positionsX: Float32Array };
    expect(nextState.positionsX[0]).toBeCloseTo(firstX, 5);

    if (originalDocument) {
      Object.defineProperty(globalThis, "document", {
        value: originalDocument,
        configurable: true
      });
    } else {
      Object.defineProperty(globalThis, "document", {
        value: undefined,
        configurable: true
      });
    }
  });
});
