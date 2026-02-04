import { describe, expect, it, vi } from "vitest";

import { BorderMultiplexEffect } from "./borderMultiplexEffect";

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

const createContext = () => {
  const ctx = {
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    set globalAlpha(_value: number) {},
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {},
    set lineWidth(_value: number) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("BorderMultiplexEffect", () => {
  it("clamps sprite counts and uses deterministic seeding", () => {
    const effect = new BorderMultiplexEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { hwSprites: 2, totalSprites: 10, seed: 4 }
    });

    const state = effect as unknown as { templates: Array<unknown>; spritesX: Float32Array };
    expect(state.templates.length).toBe(4);
    expect(state.spritesX.length).toBe(16);
    const firstX = state.spritesX[0];

    effect.reset();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { hwSprites: 2, totalSprites: 10, seed: 4 }
    });

    const nextState = effect as unknown as { spritesX: Float32Array };
    expect(nextState.spritesX[0]).toBeCloseTo(firstX, 5);
  });
});
