import { describe, expect, it } from "vitest";
import { getWheelSteppedNumberValue } from "./numberInputWheel";

describe("getWheelSteppedNumberValue", () => {
  it("increments when wheel scrolls up", () => {
    const input = {
      value: "2",
      min: "0",
      max: "5",
      step: "0.5"
    };
    expect(getWheelSteppedNumberValue(input, -100)).toBe(2.5);
  });

  it("decrements when wheel scrolls down", () => {
    const input = {
      value: "2",
      min: "0",
      max: "5",
      step: "0.5"
    };
    expect(getWheelSteppedNumberValue(input, 100)).toBe(1.5);
  });

  it("falls back to step 1 when step is invalid", () => {
    const input = {
      value: "2",
      min: "0",
      max: "5",
      step: "any"
    };
    expect(getWheelSteppedNumberValue(input, -100)).toBe(3);
  });

  it("returns clamped current value for neutral wheel deltas", () => {
    const input = {
      value: "99",
      min: "0",
      max: "5",
      step: "0.5"
    };
    expect(getWheelSteppedNumberValue(input, 0)).toBe(5);
    expect(getWheelSteppedNumberValue(input, Number.NaN)).toBe(5);
  });

  it("treats empty current values as zero before stepping", () => {
    const input = {
      value: "",
      min: "-2",
      max: "2",
      step: "0.5"
    };
    expect(getWheelSteppedNumberValue(input, -100)).toBe(0.5);
  });
});
