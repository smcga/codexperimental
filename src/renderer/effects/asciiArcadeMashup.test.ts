import { describe, expect, it, vi } from "vitest";

import {
  ASCII_ARCADE_MASHUP_DEFAULTS,
  AsciiArcadeMashupEffect,
  resolveAsciiArcadeMashupParams,
  selectSnapshotIndices
} from "./asciiArcadeMashup";

const createContext = () =>
  ({
    fillRect: vi.fn(),
    fillText: vi.fn(),
    set fillStyle(_value: string) {},
    set textAlign(_value: CanvasTextAlign) {},
    set textBaseline(_value: CanvasTextBaseline) {},
    set font(_value: string) {},
    set shadowColor(_value: string) {},
    set shadowBlur(_value: number) {}
  }) as unknown as CanvasRenderingContext2D;

describe("resolveAsciiArcadeMashupParams", () => {
  it("clamps values into supported ranges", () => {
    expect(resolveAsciiArcadeMashupParams({ speed: 12, blend: -1, density: 3, glow: 2, scanlines: -2, seed: -7 })).toEqual({
      speed: 3,
      blend: 0,
      density: 1.8,
      glow: 1,
      scanlines: 0,
      seed: 7
    });
  });

  it("uses defaults when omitted", () => {
    expect(resolveAsciiArcadeMashupParams({})).toEqual(ASCII_ARCADE_MASHUP_DEFAULTS);
  });
});

describe("selectSnapshotIndices", () => {
  it("selects adjacent snapshots and normalized blend", () => {
    const selection = selectSnapshotIndices(2.4, 1);
    expect(selection.from).toBeGreaterThanOrEqual(0);
    expect(selection.from).toBeLessThan(4);
    expect(selection.to).toBe((selection.from + 1) % 4);
    expect(selection.t).toBeGreaterThanOrEqual(0);
    expect(selection.t).toBeLessThan(1);
  });
});

describe("AsciiArcadeMashupEffect", () => {
  it("renders ascii glyphs", () => {
    const effect = new AsciiArcadeMashupEffect();
    const ctx = createContext();

    effect.render({ ctx, width: 640, height: 360, time: 1.25, delta: 0.016, audio: null, params: { density: 1.2, seed: 12 } });

    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });
});
