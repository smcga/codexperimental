import { describe, expect, it, vi } from "vitest";

import { MOIRE_GRID_DEFAULTS, MoireGridEffect, resolveMoireGridParams } from "./moireGridEffect";
import { EffectRenderContext } from "./types";

type FillCall = { fillStyle: string; x: number; y: number; width: number; height: number };

const createContext = () => {
  const fillCalls: FillCall[] = [];
  let fillStyle = "";
  const ctx = {
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
    width: 120,
    height: 80,
    time: 1.75,
    delta: 1 / 60,
    audio: { rms: 0.3, bass: 0.5, beat: true },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveMoireGridParams", () => {
  it("clamps values and resolves fallback palette", () => {
    const resolved = resolveMoireGridParams({
      spacing: 2,
      lineWidth: 22,
      speed: -20,
      warp: 500,
      intensity: -1,
      palette: "invalid",
      audioReact: 5
    });

    expect(resolved).toEqual({
      spacing: 6,
      lineWidth: 12,
      speed: -6,
      warp: 120,
      intensity: 0.1,
      palette: MOIRE_GRID_DEFAULTS.palette,
      audioReact: 1
    });
  });

  it("uses defaults when params are omitted", () => {
    expect(resolveMoireGridParams({})).toEqual(MOIRE_GRID_DEFAULTS);
  });
});

describe("MoireGridEffect", () => {
  it("renders deterministic grid lines for fixed inputs", () => {
    const params = {
      spacing: 20,
      lineWidth: 2,
      speed: 1.2,
      warp: 16,
      intensity: 0.8,
      palette: "magenta",
      audioReact: 0.4
    };

    const effectA = new MoireGridEffect();
    const { ctx: ctxA, fillCalls: callsA } = createContext();
    effectA.render(createRenderContext(ctxA, params));

    const effectB = new MoireGridEffect();
    const { ctx: ctxB, fillCalls: callsB } = createContext();
    effectB.render(createRenderContext(ctxB, params));

    expect(callsA).toEqual(callsB);
    expect(callsA[0]).toEqual({
      fillStyle: "rgb(6, 8, 16)",
      x: 0,
      y: 0,
      width: 120,
      height: 80
    });
    expect(callsA).toHaveLength(13);
  });
});
