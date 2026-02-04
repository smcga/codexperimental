import { describe, expect, it } from "vitest";

import { hashFloat, sampleField } from "./fluidSimEffect";

describe("fluid sim helpers", () => {
  it("produces stable hash values", () => {
    expect(hashFloat(0)).toBeCloseTo(0, 5);
    expect(hashFloat(12.5)).toBeCloseTo(0.0864, 3);
    expect(hashFloat(42.25)).toBeCloseTo(0.2064, 3);
  });

  it("bilinearly samples the density field", () => {
    const field = new Float32Array([0, 1, 1, 0]);
    const value = sampleField(field, 2, 2, 0.5, 0.5);
    expect(value).toBeCloseTo(0.5, 3);
  });
});
