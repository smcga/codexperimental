import { describe, expect, it } from "vitest";

import {
  HEX_GRID_PULSE_DEFAULTS,
  resolveHexGridPulseEraStyle,
  resolveHexGridPulseParams,
  sampleHexGridPulseWave
} from "./hexGridPulseEffect";

describe("hexGridPulseEffect helpers", () => {
  it("resolves clamped params with invert coercion", () => {
    const params = resolveHexGridPulseParams({
      cellSize: 2,
      speed: 9,
      waveScale: -1,
      invert: 0.8
    });

    expect(params.cellSize).toBe(8);
    expect(params.speed).toBe(4);
    expect(params.waveScale).toBe(0.1);
    expect(params.invert).toBe(1);
  });

  it("samples deterministic wave values for the same inputs", () => {
    const first = sampleHexGridPulseWave(10, -4, 52, 3.5, 1.2, 0.9, 0.6);
    const second = sampleHexGridPulseWave(10, -4, 52, 3.5, 1.2, 0.9, 0.6);
    const shifted = sampleHexGridPulseWave(10, -4, 52, 3.6, 1.2, 0.9, 0.6);

    expect(first).toBe(second);
    expect(shifted).not.toBe(first);
  });

  it("applies stronger contrast and quantization for 8bit era", () => {
    const eightBit = resolveHexGridPulseEraStyle("8bit");
    const future = resolveHexGridPulseEraStyle("future");

    expect(eightBit.quantize).toBeGreaterThan(0);
    expect(eightBit.contrast).toBeGreaterThan(future.contrast);
    expect(future.glow).toBeGreaterThan(eightBit.glow);
  });

  it("keeps documented defaults stable", () => {
    expect(HEX_GRID_PULSE_DEFAULTS).toMatchObject({
      cellSize: 24,
      speed: 1,
      audioReactive: 0.5,
      invert: 0
    });
  });
});
