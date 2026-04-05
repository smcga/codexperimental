import { describe, expect, it } from "vitest";
import { clampDiffusion, normalizeSmokeParams, resolveEmitMode, SMOKE_DEFAULTS } from "./smokeSimulation";

describe("SmokeSimulationEffect param helpers", () => {
  it("normalizes and clamps numeric params", () => {
    const normalized = normalizeSmokeParams({
      density: 4,
      flowSpeed: -1,
      turbulence: 5,
      scale: 0.1,
      highlights: -2
    });

    expect(normalized.density).toBe(1.3);
    expect(normalized.flowSpeed).toBe(0);
    expect(normalized.turbulence).toBe(2);
    expect(normalized.scale).toBe(0.5);
    expect(normalized.highlights).toBe(0);
  });

  it("resolves emit mode with safe fallback", () => {
    expect(resolveEmitMode("centre")).toBe("centre");
    expect(resolveEmitMode("bottom")).toBe("bottom");
    expect(resolveEmitMode("random")).toBe("random");
    expect(resolveEmitMode("unknown")).toBe(SMOKE_DEFAULTS.emitMode);
    expect(resolveEmitMode(123)).toBe(SMOKE_DEFAULTS.emitMode);
  });

  it("clamps diffusion factor to bounds", () => {
    expect(clampDiffusion(-1)).toBe(0);
    expect(clampDiffusion(0.45)).toBe(0.45);
    expect(clampDiffusion(10)).toBe(1);
    expect(clampDiffusion("not-a-number")).toBe(SMOKE_DEFAULTS.diffusion);
  });
});
