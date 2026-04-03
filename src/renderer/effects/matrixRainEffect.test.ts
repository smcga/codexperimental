import { describe, expect, it, vi } from "vitest";

import {
  MATRIX_RAIN_DEFAULTS,
  MatrixRainEffect,
  getMatrixColumnCount,
  isMatrixColumnActive,
  resolveBaseFallSpeed,
  resolveMatrixRainParams,
  sampleMatrixGlyph
} from "./matrixRainEffect";

const createAudio = () => ({
  timeDomain: new Uint8Array(0),
  frequency: new Uint8Array(0),
  rms: 0.2,
  bass: 0,
  mid: 0,
  treble: 0.1,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
});

const createContext = () => {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    set font(_value: string) {},
    set textAlign(_value: CanvasTextAlign) {},
    set textBaseline(_value: CanvasTextBaseline) {},
    set shadowBlur(_value: number) {},
    set shadowColor(_value: string) {},
    set fillStyle(_value: string) {}
  } as unknown as CanvasRenderingContext2D;

  return ctx;
};

describe("resolveMatrixRainParams", () => {
  it("clamps user params into supported ranges", () => {
    expect(
      resolveMatrixRainParams({
        speed: 99,
        density: -1,
        fontSize: 4,
        trail: 9,
        glow: -1,
        brightness: 5,
        jitter: -2,
        glyphSet: -3,
        seed: -17
      })
    ).toEqual({
      speed: 4,
      density: 0.1,
      fontSize: 8,
      trail: 1,
      glow: 0,
      brightness: 1.4,
      jitter: 0,
      glyphSet: 3,
      seed: 17
    });
  });

  it("returns defaults when params are omitted", () => {
    expect(resolveMatrixRainParams({})).toEqual(MATRIX_RAIN_DEFAULTS);
  });
});

describe("matrixRainEffect helpers", () => {
  it("samples deterministic glyphs for identical inputs", () => {
    const glyphA = sampleMatrixGlyph(3, 7, 1.25, 0, 1337);
    const glyphB = sampleMatrixGlyph(3, 7, 1.25, 0, 1337);

    expect(glyphA).toBe(glyphB);
    expect(glyphA.length).toBeGreaterThan(0);
  });

  it("activates more columns as density increases", () => {
    const columns = Array.from({ length: 40 }, (_, index) => index);
    const sparse = columns.filter((column) => isMatrixColumnActive(column, 99, 0.25)).length;
    const dense = columns.filter((column) => isMatrixColumnActive(column, 99, 0.85)).length;

    expect(dense).toBeGreaterThan(sparse);
    expect(getMatrixColumnCount(320, 16)).toBeGreaterThan(0);
  });

  it("keeps low speed in a slow cinematic range", () => {
    const slow = resolveBaseFallSpeed(0.2);
    const medium = resolveBaseFallSpeed(1);
    const fast = resolveBaseFallSpeed(4);

    expect(slow).toBeLessThan(20);
    expect(medium).toBeGreaterThan(slow);
    expect(fast).toBeGreaterThan(medium);
    expect(fast).toBeLessThanOrEqual(95);
  });
});

describe("MatrixRainEffect", () => {
  it("renders code glyphs and scanlines", () => {
    const effect = new MatrixRainEffect();
    const ctx = createContext();

    effect.render({
      ctx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { density: 0.8, seed: 4, fontSize: 16 }
    });

    expect(ctx.fillText).toHaveBeenCalled();
    expect(ctx.fillRect.mock.calls.length).toBeGreaterThan(20);
  });

  it("renders more glyphs at higher density", () => {
    const effect = new MatrixRainEffect();
    const sparseCtx = createContext();
    const denseCtx = createContext();

    effect.render({
      ctx: sparseCtx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { density: 0.2, seed: 7, fontSize: 16 }
    });

    effect.render({
      ctx: denseCtx,
      width: 320,
      height: 180,
      time: 1,
      delta: 0.016,
      audio: createAudio(),
      params: { density: 0.95, seed: 7, fontSize: 16 }
    });

    expect(denseCtx.fillText.mock.calls.length).toBeGreaterThan(sparseCtx.fillText.mock.calls.length);
  });

  it("keeps x-position stable when jitter is zero", () => {
    const effect = new MatrixRainEffect();
    const times = Array.from({ length: 81 }, (_, index) => index * 0.25);

    const findXValues = (time: number): number[] => {
      const ctx = createContext();
      effect.render({
        ctx,
        width: 40,
        height: 160,
        time,
        delta: 0.016,
        audio: createAudio(),
        params: { density: 1, seed: 3, fontSize: 10, jitter: 0 }
      });
      return ctx.fillText.mock.calls.map((call) => Number(call[1])).filter((value) => Number.isFinite(value));
    };

    const baseTime = times.find((value) => findXValues(value).length > 0);
    expect(baseTime).not.toBeUndefined();

    const firstXValues = findXValues(baseTime ?? 0);
    const secondXValues = findXValues((baseTime ?? 0) + 0.4);

    expect(firstXValues.length).toBeGreaterThan(0);
    expect(secondXValues.length).toBeGreaterThan(0);
    expect(secondXValues[0]).toBe(firstXValues[0]);
  });

  it("updates glyph positions over time for smooth motion", () => {
    const effect = new MatrixRainEffect();
    const times = [0, 0.4, 0.8, 1.2, 1.6];

    const findYValues = (time: number): number[] => {
      const ctx = createContext();
      effect.render({
        ctx,
        width: 80,
        height: 220,
        time,
        delta: 0.016,
        audio: createAudio(),
        params: { density: 1, seed: 3, fontSize: 10, jitter: 0 }
      });
      return ctx.fillText.mock.calls.map((call) => Number(call[2])).filter((value) => Number.isFinite(value));
    };

    const baseTime = times.find((value) => findYValues(value).length > 0);
    expect(baseTime).not.toBeUndefined();

    const firstYValues = findYValues(baseTime ?? 0);
    const secondYValues = findYValues((baseTime ?? 0) + 0.08);

    expect(firstYValues.length).toBeGreaterThan(0);
    expect(secondYValues.length).toBeGreaterThan(0);

    const sharedIndex = Math.min(firstYValues.length, secondYValues.length) - 1;
    expect(secondYValues[sharedIndex]).not.toBe(firstYValues[sharedIndex]);
  });
});
