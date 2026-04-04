import { describe, expect, it } from "vitest";
import { calculateLuminance, resolveSsaoAo } from "./ssaoPostCanvas";

describe("ssao post canvas helpers", () => {
  it("computes Rec.601 luminance", () => {
    expect(calculateLuminance(255, 255, 255)).toBeCloseTo(255, 5);
    expect(calculateLuminance(255, 0, 0)).toBeCloseTo(76.245, 3);
    expect(calculateLuminance(0, 255, 0)).toBeCloseTo(149.685, 3);
    expect(calculateLuminance(0, 0, 255)).toBeCloseTo(29.07, 3);
  });

  it("clamps AO shade factor", () => {
    expect(resolveSsaoAo(0, 0.6)).toBeCloseTo(1);
    expect(resolveSsaoAo(0.5, 0.6)).toBeCloseTo(0.7);
    expect(resolveSsaoAo(8, 1)).toBeCloseTo(0.2);
  });
});
