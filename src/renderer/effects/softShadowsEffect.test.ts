import { describe, expect, it } from "vitest";

import { buildShadowPassProfile, resolveLightDirection, resolvePassCountForEra } from "./softShadowsEffect";

describe("soft shadows helper math", () => {
  it("resolves a unit light direction from angle", () => {
    const dir = resolveLightDirection(Math.PI / 3);
    expect(Math.hypot(dir.x, dir.y)).toBeCloseTo(1, 6);
  });

  it("caps pass count in retro eras", () => {
    expect(resolvePassCountForEra(11, "8bit")).toBe(3);
    expect(resolvePassCountForEra(11, "16bit")).toBe(4);
    expect(resolvePassCountForEra(11, "future")).toBe(11);
  });

  it("builds a monotonic spread profile for penumbra layering", () => {
    const passes = buildShadowPassProfile(6, 0.6, 0.7, 1.2, 30);
    expect(passes).toHaveLength(6);

    for (let i = 1; i < passes.length; i += 1) {
      expect(passes[i].offset).toBeGreaterThan(passes[i - 1].offset);
      expect(passes[i].radiusX).toBeGreaterThanOrEqual(passes[i - 1].radiusX);
      expect(passes[i].radiusY).toBeGreaterThanOrEqual(passes[i - 1].radiusY);
      expect(passes[i].alpha).toBeLessThanOrEqual(passes[i - 1].alpha);
    }
  });
});
