import { describe, expect, it, vi } from "vitest";

import { EffectEvolution } from "./effectEvolution";

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
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    set fillStyle(_value: string) {},
    set strokeStyle(_value: string) {},
    set globalCompositeOperation(_value: string) {},
    set lineWidth(_value: number) {},
    set globalAlpha(_value: number) {}
  }) as unknown as CanvasRenderingContext2D;

describe("EffectEvolution", () => {
  it("clamps the lattice size based on density", () => {
    const effect = new EffectEvolution();
    effect.render({
      ctx: createContext(),
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { density: 0.2 },
      era: "8bit"
    });

    const nodes = (effect as unknown as { nodes: Array<unknown> }).nodes;
    expect(nodes).toHaveLength(128);
  });

  it("rebuilds the lattice when the seed changes", () => {
    const effect = new EffectEvolution();
    const context = createContext();

    effect.render({
      ctx: context,
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio(),
      params: { seed: 4 },
      era: "16bit"
    });

    const firstX = (effect as unknown as { nodes: Array<{ x: number }> }).nodes[0]?.x ?? 0;

    effect.render({
      ctx: context,
      width: 320,
      height: 180,
      time: 0.5,
      delta: 0.016,
      audio: createAudio(),
      params: { seed: 9 },
      era: "16bit"
    });

    const secondX = (effect as unknown as { nodes: Array<{ x: number }> }).nodes[0]?.x ?? 0;
    expect(secondX).not.toBe(firstX);
  });

  it("records a beat shockwave", () => {
    const effect = new EffectEvolution();

    effect.render({
      ctx: createContext(),
      width: 320,
      height: 180,
      time: 0,
      delta: 0.016,
      audio: createAudio({ beat: true, bass: 0.4 }),
      params: {},
      era: "ps1"
    });

    const shock = (effect as unknown as { shock: number }).shock;
    expect(shock).toBeGreaterThan(0);
  });
});
