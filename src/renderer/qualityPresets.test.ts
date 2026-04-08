import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUALITY_PRESET_ID,
  getQualityPresetById,
  getQualityPresets,
  resolveInitialQualityPresetId
} from "./qualityPresets";

describe("quality presets", () => {
  it("exposes the expected preset metadata", () => {
    expect(getQualityPresets()).toEqual([
      { id: "performance", label: "Best performance", qualityScale: 0.65, autoQuality: true },
      { id: "balanced", label: "Balanced", qualityScale: 0.85, autoQuality: true },
      { id: "quality", label: "Maximum", qualityScale: 1, autoQuality: false }
    ]);
  });

  it("resolves exact matching presets from render settings", () => {
    expect(resolveInitialQualityPresetId(0.65, true)).toBe("performance");
    expect(resolveInitialQualityPresetId(0.85, true)).toBe("balanced");
    expect(resolveInitialQualityPresetId(1, false)).toBe("quality");
  });

  it("falls back to the default preset for custom query values", () => {
    expect(resolveInitialQualityPresetId(0.97, true)).toBe(DEFAULT_QUALITY_PRESET_ID);
    expect(resolveInitialQualityPresetId(0.83, false)).toBe(DEFAULT_QUALITY_PRESET_ID);
  });

  it("looks up presets by id", () => {
    expect(getQualityPresetById("performance").autoQuality).toBe(true);
    expect(getQualityPresetById("quality").qualityScale).toBe(1);
  });
});
