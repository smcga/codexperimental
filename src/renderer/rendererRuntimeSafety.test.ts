import { describe, expect, it } from "vitest";

import { sanitizeRuntimeEffectParams } from "./effectRuntimeSafety";

describe("renderer runtime safety", () => {
  it("clamps params to manifest bounds and hard caps", () => {
    const params = sanitizeRuntimeEffectParams(
      { speed: 99, chaos: 5000, negative: -5000 },
      [{ key: "speed", min: 0, max: 2 }]
    );

    expect(params.speed).toBe(2);
    expect(params.chaos).toBe(1000);
    expect(params.negative).toBe(-1000);
  });

  it("coerces non-finite values to 0", () => {
    const params = sanitizeRuntimeEffectParams({ bad: Number.NaN, inf: Number.POSITIVE_INFINITY });
    expect(params.bad).toBe(0);
    expect(params.inf).toBe(0);
  });
});
