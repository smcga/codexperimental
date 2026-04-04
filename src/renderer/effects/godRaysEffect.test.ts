import { describe, expect, it, vi } from "vitest";

import { EffectRenderContext } from "./types";
import { GOD_RAYS_DEFAULTS, GodRaysEffect, resolveGodRaysParams } from "./godRaysEffect";

type DrawCall = { type: string; fillStyle: string; composite: string };

const createContext = () => {
  const drawCalls: DrawCall[] = [];
  let fillStyle = "";
  let composite = "source-over";

  const gradient = {
    addColorStop: vi.fn()
  } as unknown as CanvasGradient;

  const ctx = {
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(() => drawCalls.push({ type: "fillRect", fillStyle, composite })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    ellipse: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(() => drawCalls.push({ type: "fill", fillStyle, composite })),
    save: vi.fn(),
    restore: vi.fn(),
    set fillStyle(value: string | CanvasGradient) {
      fillStyle = typeof value === "string" ? value : "gradient";
    },
    get fillStyle() {
      return fillStyle;
    },
    set globalCompositeOperation(value: string) {
      composite = value;
    },
    get globalCompositeOperation() {
      return composite;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, drawCalls };
};

const renderContext = (ctx: CanvasRenderingContext2D, params: Record<string, unknown>, era = "future"): EffectRenderContext =>
  ({
    ctx,
    width: 320,
    height: 180,
    time: 3.2,
    delta: 1 / 60,
    audio: { rms: 0.35, bass: 0.42, treble: 0.3, beat: true },
    params: params as Record<string, number>,
    era
  } as EffectRenderContext);

describe("resolveGodRaysParams", () => {
  it("uses defaults and validates style", () => {
    expect(resolveGodRaysParams({}, "pcdemo")).toEqual({
      ...GOD_RAYS_DEFAULTS,
      haze: 0.63
    });

    expect(resolveGodRaysParams({ style: "unknown" }, "pcdemo").style).toBe("sunbreak");
  });

  it("applies clamping and era-specific tuning", () => {
    const params = resolveGodRaysParams(
      {
        sourceX: 99,
        sourceY: -99,
        rayCount: 80,
        spread: -1,
        haze: 5,
        seed: -3
      },
      "8bit"
    );
    expect(params.sourceX).toBe(1.5);
    expect(params.sourceY).toBe(-0.5);
    expect(params.rayCount).toBe(56);
    expect(params.spread).toBe(0.1);
    expect(params.haze).toBe(1.2);
    expect(params.seed).toBe(3);
  });
});

describe("GodRaysEffect", () => {
  it("renders deterministically for fixed inputs", () => {
    const params = {
      seed: 7,
      style: "cathedral",
      rayCount: 14,
      dust: 0.3,
      occlusion: 0.55
    };

    const effectA = new GodRaysEffect();
    const { ctx: ctxA, drawCalls: callsA } = createContext();
    effectA.render(renderContext(ctxA, params));

    const effectB = new GodRaysEffect();
    const { ctx: ctxB, drawCalls: callsB } = createContext();
    effectB.render(renderContext(ctxB, params));

    expect(callsA).toEqual(callsB);
    expect(callsA[0]).toEqual({ type: "fillRect", fillStyle: "gradient", composite: "source-over" });
    expect(callsA.some((call) => call.composite === "destination-out")).toBe(true);
    expect(callsA.some((call) => call.composite === "lighter")).toBe(true);
  });

  it("changes occlusion profile for window style", () => {
    const effect = new GodRaysEffect();
    const { ctx, drawCalls } = createContext();
    effect.render(renderContext(ctx, { seed: 2, style: "window", occlusion: 1, shadowBands: 0.8 }, "ps1"));
    const occlusionRects = drawCalls.filter((call) => call.type === "fillRect" && call.composite === "destination-out");
    expect(occlusionRects.length).toBeGreaterThan(6);
  });
});
