import { describe, expect, it, vi } from "vitest";

import {
  NEURAL_CONSTELLATION_DEFAULTS,
  NeuralConstellationEffect,
  buildNeuralConstellationLayout,
  resolveNeuralConstellationParams
} from "./neuralConstellation";
import { EffectRenderContext } from "./types";

type DrawCall = { op: string; args: Array<number | string> };

const createContext = () => {
  const calls: DrawCall[] = [];
  let fillStyle = "";
  let strokeStyle = "";
  const record = (op: string, ...args: Array<number | string>) => {
    calls.push({ op, args });
  };
  const ctx = {
    lineWidth: 1,
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => record("fillRect", fillStyle, x, y, w, h)),
    beginPath: vi.fn(),
    moveTo: vi.fn((x: number, y: number) => record("moveTo", x, y)),
    lineTo: vi.fn((x: number, y: number) => record("lineTo", x, y)),
    stroke: vi.fn(() => record("stroke", strokeStyle)),
    arc: vi.fn((x: number, y: number, r: number) => record("arc", x, y, r)),
    fill: vi.fn(() => record("fill", fillStyle)),
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get fillStyle() {
      return fillStyle;
    },
    set strokeStyle(value: string) {
      strokeStyle = value;
    },
    get strokeStyle() {
      return strokeStyle;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
};

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>
): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 180,
    time: 4.25,
    delta: 1 / 60,
    audio: { rms: 0, bass: 0, mid: 0, treble: 0, beat: false, beatStrength: 0, impactStrength: 0 },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveNeuralConstellationParams", () => {
  it("uses explicit defaults and clamps out-of-range values", () => {
    const resolved = resolveNeuralConstellationParams({
      layers: 99,
      neurons: -4,
      pulseSpeed: 100,
      glow: -1,
      hue: 999,
      drift: 50,
      audioReact: -3,
      seed: 0
    });

    expect(resolved).toEqual({
      layers: 8,
      neurons: 3,
      pulseSpeed: 4,
      glow: 0,
      hue: 360,
      drift: 2,
      audioReact: 0,
      seed: 1
    });
  });

  it("falls back to defaults when params are absent", () => {
    expect(resolveNeuralConstellationParams({})).toEqual(NEURAL_CONSTELLATION_DEFAULTS);
  });
});

describe("buildNeuralConstellationLayout", () => {
  it("builds the requested layer count with nodes inside the frame", () => {
    const config = resolveNeuralConstellationParams({ layers: 5, neurons: 8, seed: 21 });
    const layout = buildNeuralConstellationLayout(config, 320, 180);

    expect(layout).toHaveLength(5);
    layout.forEach((layer) => {
      expect(layer.length).toBeGreaterThanOrEqual(3);
      expect(layer.length).toBeLessThanOrEqual(8);
      layer.forEach((node) => {
        expect(node.baseX).toBeGreaterThanOrEqual(0);
        expect(node.baseX).toBeLessThanOrEqual(320);
        expect(node.baseY).toBeGreaterThanOrEqual(0);
        expect(node.baseY).toBeLessThanOrEqual(180);
      });
    });
  });

  it("keeps hidden layers wider than the input and output layers", () => {
    const config = resolveNeuralConstellationParams({ layers: 5, neurons: 12, seed: 3 });
    const layout = buildNeuralConstellationLayout(config, 320, 180);
    const middle = layout[2].length;

    expect(middle).toBeGreaterThan(layout[0].length);
    expect(middle).toBeGreaterThan(layout[layout.length - 1].length);
  });

  it("is deterministic for a fixed seed", () => {
    const config = resolveNeuralConstellationParams({ seed: 42 });
    expect(buildNeuralConstellationLayout(config, 320, 180)).toEqual(buildNeuralConstellationLayout(config, 320, 180));
  });
});

describe("NeuralConstellationEffect", () => {
  it("is deterministic for fixed time and params", () => {
    const params = { layers: 4, neurons: 6, pulseSpeed: 1.5, glow: 1, hue: 190, drift: 0.5, audioReact: 1, seed: 11 };

    const effectA = new NeuralConstellationEffect();
    const { ctx: ctxA, calls: callsA } = createContext();
    effectA.render(createRenderContext(ctxA, params));

    const effectB = new NeuralConstellationEffect();
    const { ctx: ctxB, calls: callsB } = createContext();
    effectB.render(createRenderContext(ctxB, params));

    expect(callsA).toEqual(callsB);
    expect(callsA.length).toBeGreaterThan(0);
  });

  it("clears the layout cache on reset", () => {
    const effect = new NeuralConstellationEffect();
    const { ctx } = createContext();
    effect.render(createRenderContext(ctx, { seed: 5 }));

    effect.reset();

    const { ctx: ctxAfter, calls: callsAfter } = createContext();
    effect.render(createRenderContext(ctxAfter, { seed: 5 }));
    expect(callsAfter.length).toBeGreaterThan(0);
  });

  it("draws background, synapses, and neuron cores", () => {
    const effect = new NeuralConstellationEffect();
    const { ctx, calls } = createContext();
    effect.render(createRenderContext(ctx, { layers: 3, neurons: 4, seed: 2 }));

    const ops = calls.map((call) => call.op);
    expect(ops).toContain("fillRect");
    expect(ops).toContain("stroke");
    expect(ops).toContain("fill");
    expect(calls[0]).toEqual({ op: "fillRect", args: ["#04060f", 0, 0, 320, 180] });
  });
});
