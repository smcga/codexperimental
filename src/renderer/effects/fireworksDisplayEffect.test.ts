import { describe, expect, it } from "vitest";
import { FIREWORKS_DISPLAY_DEFAULTS, fireworksHash01, fireworksPalette } from "./fireworksDisplayEffect";

describe("fireworks display helpers", () => {
  it("keeps deterministic hash values in [0, 1)", () => {
    const samples = [0, 1, 12.34, 99.01, 1234.567].map((v) => fireworksHash01(v));
    samples.forEach((sample) => {
      expect(sample).toBeGreaterThanOrEqual(0);
      expect(sample).toBeLessThan(1);
    });
    expect(samples[0]).toBe(fireworksHash01(0));
    expect(samples[3]).toBe(fireworksHash01(99.01));
  });

  it("produces hsla palette strings for core/spark/smoke colors", () => {
    const palette = fireworksPalette(220, 2);
    expect(palette.core).toContain("hsla(");
    expect(palette.spark).toContain("hsla(");
    expect(palette.smoke).toContain("hsla(");
  });

  it("exposes stable defaults for docs/debug controls", () => {
    expect(FIREWORKS_DISPLAY_DEFAULTS.shellRate).toBeGreaterThan(0);
    expect(FIREWORKS_DISPLAY_DEFAULTS.launchSpread).toBeLessThanOrEqual(1);
    expect(FIREWORKS_DISPLAY_DEFAULTS.seed).toBe(0);
  });
});
