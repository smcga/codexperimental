import { describe, expect, it } from "vitest";
import {
  applyCurrentValuesAsGeneratedDefaults,
  getGeneratedEffectDefaultParams,
  getRandomGeneratedEffectParams
} from "./generatedEffectControls";

const SAMPLE_PARAMS = [
  { key: "speed", label: "Speed", type: "number" as const, defaultValue: 0.5, min: 0, max: 1, step: 0.1 },
  { key: "mode", label: "Mode", type: "select" as const, defaultValue: "warp", options: [{ label: "Warp", value: "warp" }, { label: "Calm", value: "calm" }] },
  { key: "glow", label: "Glow", type: "toggle" as const, defaultValue: 1 }
];

describe("generated effect controls helpers", () => {
  it("builds defaults from generated params", () => {
    expect(getGeneratedEffectDefaultParams(SAMPLE_PARAMS)).toEqual({
      speed: 0.5,
      mode: "warp",
      glow: 1
    });
  });

  it("randomizes generated params across supported control types", () => {
    const values = [0.99, 0.3, 0.1];
    let index = 0;
    const random = () => {
      const value = values[index] ?? 0;
      index += 1;
      return value;
    };
    expect(getRandomGeneratedEffectParams(SAMPLE_PARAMS, random)).toEqual({
      speed: 1,
      mode: "warp",
      glow: 0
    });
  });

  it("applies current preview values as new defaults", () => {
    const updated = applyCurrentValuesAsGeneratedDefaults(SAMPLE_PARAMS, {
      speed: 0.8,
      mode: "calm",
      glow: 0
    });
    expect(updated.map((param) => [param.key, param.defaultValue])).toEqual([
      ["speed", 0.8],
      ["mode", "calm"],
      ["glow", 0]
    ]);
  });
});
