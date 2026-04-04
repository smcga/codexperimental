import { describe, expect, it, vi } from "vitest";

import {
  SPECTRUM_ANALYZER_DEFAULTS,
  SpectrumAnalyzerEffect,
  resolveSpectrumAnalyzerParams
} from "./spectrumAnalyzerEffect";
import { EffectRenderContext } from "./types";

type Operation =
  | { type: "fillRect"; fillStyle: string; x: number; y: number; width: number; height: number }
  | { type: "moveTo"; x: number; y: number }
  | { type: "lineTo"; x: number; y: number }
  | { type: "fill"; fillStyle: string }
  | { type: "stroke"; strokeStyle: string; lineWidth: number }
  | { type: "beginPath" }
  | { type: "closePath" };

const createContext = () => {
  const operations: Operation[] = [];
  let fillStyle = "";
  let strokeStyle = "";
  let lineWidth = 1;

  const ctx = {
    beginPath: vi.fn(() => operations.push({ type: "beginPath" })),
    closePath: vi.fn(() => operations.push({ type: "closePath" })),
    moveTo: vi.fn((x: number, y: number) => operations.push({ type: "moveTo", x, y })),
    lineTo: vi.fn((x: number, y: number) => operations.push({ type: "lineTo", x, y })),
    fill: vi.fn(() => operations.push({ type: "fill", fillStyle })),
    stroke: vi.fn(() => operations.push({ type: "stroke", strokeStyle, lineWidth })),
    fillRect: vi.fn((x: number, y: number, width: number, height: number) =>
      operations.push({ type: "fillRect", fillStyle, x, y, width, height })
    ),
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
    },
    set lineWidth(value: number) {
      lineWidth = value;
    },
    get lineWidth() {
      return lineWidth;
    }
  } as unknown as CanvasRenderingContext2D;

  return { ctx, operations };
};

const createFrequency = (value: number) => Uint8Array.from({ length: 256 }, (_, index) => clampByte(value - index * 0.25));

const clampByte = (value: number): number => Math.max(0, Math.min(255, Math.round(value)));

const createRenderContext = (
  ctx: CanvasRenderingContext2D,
  params: Record<string, unknown>,
  frequency: Uint8Array
): EffectRenderContext =>
  ({
    ctx,
    width: 160,
    height: 90,
    time: 0.5,
    delta: 1 / 60,
    audio: {
      timeDomain: new Uint8Array(2048),
      frequency,
      rms: 0.42,
      bass: 0.68,
      mid: 0.4,
      treble: 0.32,
      beat: false,
      beatStrength: 0.18,
      impactStrength: 0
    },
    params: params as Record<string, number>
  } as EffectRenderContext);

describe("resolveSpectrumAnalyzerParams", () => {
  it("clamps values and falls back to defaults", () => {
    expect(
      resolveSpectrumAnalyzerParams({
        bands: 999,
        smoothing: -1,
        curve: 3,
        tilt: -5,
        peakHold: 2,
        grid: -2,
        glow: 4
      })
    ).toEqual({
      bands: 192,
      smoothing: 0,
      curve: 2.5,
      tilt: -1,
      peakHold: 1,
      grid: 0,
      glow: 1
    });
    expect(resolveSpectrumAnalyzerParams({})).toEqual(SPECTRUM_ANALYZER_DEFAULTS);
  });
});

describe("SpectrumAnalyzerEffect", () => {
  it("renders deterministic analyzer geometry for fixed inputs", () => {
    const effectA = new SpectrumAnalyzerEffect();
    const effectB = new SpectrumAnalyzerEffect();
    const params = { bands: 24, glow: 0.7, peakHold: 0.6 };
    const frequency = createFrequency(220);

    const { ctx: ctxA, operations: operationsA } = createContext();
    const { ctx: ctxB, operations: operationsB } = createContext();

    effectA.render(createRenderContext(ctxA, params, frequency));
    effectB.render(createRenderContext(ctxB, params, frequency));

    expect(operationsA).toEqual(operationsB);
    expect(operationsA[0]).toEqual({
      type: "fillRect",
      fillStyle: "rgb(3, 7, 18)",
      x: 0,
      y: 0,
      width: 160,
      height: 90
    });
    expect(operationsA.some((operation) => operation.type === "stroke")).toBe(true);
    expect(operationsA.filter((operation) => operation.type === "fillRect").length).toBeGreaterThan(20);
  });

  it("clears held peaks when reset is called", () => {
    const effect = new SpectrumAnalyzerEffect();
    const reference = new SpectrumAnalyzerEffect();
    const params = { bands: 24, peakHold: 1 };

    effect.render(createRenderContext(createContext().ctx, params, createFrequency(255)));
    effect.reset();

    const { ctx: ctxAfterReset, operations: afterReset } = createContext();
    const { ctx: ctxReference, operations: referenceOperations } = createContext();
    const lowFrequency = createFrequency(64);

    effect.render(createRenderContext(ctxAfterReset, params, lowFrequency));
    reference.render(createRenderContext(ctxReference, params, lowFrequency));

    expect(afterReset).toEqual(referenceOperations);
  });
});
