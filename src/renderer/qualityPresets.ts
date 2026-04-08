import { clamp } from "../util/math";
import { renderSettingsDefaults } from "./renderSettings";

export type QualityPresetId = "performance" | "balanced" | "quality";

export type QualityPreset = {
  id: QualityPresetId;
  label: string;
  qualityScale: number;
  autoQuality: boolean;
};

const QUALITY_PRESET_LIST: QualityPreset[] = [
  {
    id: "performance",
    label: "Best performance",
    qualityScale: renderSettingsDefaults.MIN_QUALITY_SCALE,
    autoQuality: true
  },
  {
    id: "balanced",
    label: "Balanced",
    qualityScale: 0.85,
    autoQuality: true
  },
  {
    id: "quality",
    label: "Maximum",
    qualityScale: renderSettingsDefaults.MAX_QUALITY_SCALE,
    autoQuality: false
  }
];

const QUALITY_PRESET_MAP: Record<QualityPresetId, QualityPreset> = {
  performance: QUALITY_PRESET_LIST[0],
  balanced: QUALITY_PRESET_LIST[1],
  quality: QUALITY_PRESET_LIST[2]
};

export const DEFAULT_QUALITY_PRESET_ID: QualityPresetId = "balanced";

const QUALITY_EPSILON = 0.02;

export function getQualityPresets(): QualityPreset[] {
  return QUALITY_PRESET_LIST;
}

export function getQualityPresetById(id: QualityPresetId): QualityPreset {
  return QUALITY_PRESET_MAP[id];
}

export function resolveInitialQualityPresetId(qualityScale: number, autoQuality: boolean): QualityPresetId {
  const clampedQuality = clamp(
    qualityScale,
    renderSettingsDefaults.MIN_QUALITY_SCALE,
    renderSettingsDefaults.MAX_QUALITY_SCALE
  );

  const matchingPreset = QUALITY_PRESET_LIST.find(
    (preset) =>
      preset.autoQuality === autoQuality && Math.abs(clampedQuality - preset.qualityScale) <= QUALITY_EPSILON
  );
  return matchingPreset?.id ?? DEFAULT_QUALITY_PRESET_ID;
}
