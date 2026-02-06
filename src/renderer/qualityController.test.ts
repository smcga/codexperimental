import { describe, expect, it } from "vitest";
import { createQualityState, updateQualityState } from "./qualityController";

describe("qualityController", () => {
  it("reduces quality when frame time is high", () => {
    const state = createQualityState(1, true);
    const updated = updateQualityState(state, 20, 1000);
    expect(updated).toBe(true);
    expect(state.qualityScale).toBeCloseTo(0.95, 5);
  });

  it("increases quality when frame time is low", () => {
    const state = createQualityState(0.8, true);
    const updated = updateQualityState(state, 12, 1000);
    expect(updated).toBe(true);
    expect(state.qualityScale).toBeCloseTo(0.85, 5);
  });

  it("does nothing when autoQuality is disabled", () => {
    const state = createQualityState(1, false);
    const updated = updateQualityState(state, 25, 1000);
    expect(updated).toBe(false);
    expect(state.qualityScale).toBe(1);
  });
});
