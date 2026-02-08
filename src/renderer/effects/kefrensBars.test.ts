import { describe, expect, it, vi } from "vitest";

import { KEFRENS_BARS_DEFAULTS, KefrensBarsEffect, resolveKefrensBarsParams } from "./kefrensBars";
import { EffectRenderContext } from "./types";

type FillCall = { fillStyle: string; x: number; y: number; width: number; height: number };

const createContext = () => {
  const fillCalls: FillCall[] = [];
  let fillStyle = "";
  const ctx = {
    clearRect: vi.fn(),
    fillRect: vi.fn((x: number, y: number, width: number, height: number) => {
      fillCalls.push({ fillStyle, x, y, width, height });
    }),
    set fillStyle(value: string) {
      fillStyle = value;
    },
    get fillStyle() {
      return fillStyle;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, fillCalls };
};

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>
): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 200,
    time: 3.5,
    delta: 1 / 60,
    audio: { rms: 0, bass: 0, beat: false },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveKefrensBarsParams", () => {
  it("uses explicit defaults and clamps out-of-range values", () => {
    const resolved = resolveKefrensBarsParams({
      barCount: -5,
      barWidth: 999,
      amp: -12,
      freq: 99,
      speed: -99,
      phaseOffset: 99,
      palette: "not-valid"
    });

    expect(resolved).toEqual({
      barCount: 1,
      barWidth: 160,
      amp: 0,
      freq: 20,
      speed: -10,
      phaseOffset: Math.PI * 2,
      palette: KEFRENS_BARS_DEFAULTS.palette
    });
  });

  it("falls back to defaults when params are absent", () => {
    expect(resolveKefrensBarsParams({})).toEqual(KEFRENS_BARS_DEFAULTS);
  });
});

describe("KefrensBarsEffect", () => {
  it("is deterministic for fixed time and params", () => {
    const params = {
      barCount: 6,
      barWidth: 10,
      amp: 32,
      freq: 1.8,
      speed: 1.25,
      phaseOffset: 0.45,
      palette: "c64"
    };

    const effectA = new KefrensBarsEffect();
    const { ctx: ctxA, fillCalls: callsA } = createContext();
    effectA.render(createRenderContext(ctxA, params));

    const effectB = new KefrensBarsEffect();
    const { ctx: ctxB, fillCalls: callsB } = createContext();
    effectB.render(createRenderContext(ctxB, params));

    expect(callsA).toEqual(callsB);
    expect(callsA).toHaveLength(6);
  });
});
