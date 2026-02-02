import { EraPreset, SectionConfig, TransitionType } from "../config/loadConfig";

export type TransitionState = {
  from: SectionConfig;
  to: SectionConfig;
  progress: number;
  type: TransitionType;
};

export function applyEraOverride(section: SectionConfig, eraOverride: EraPreset | null): SectionConfig {
  if (!eraOverride) {
    return section;
  }
  return { ...section, era: eraOverride };
}

export function applyEraOverrideToTransition(
  transition: TransitionState | undefined,
  eraOverride: EraPreset | null
): TransitionState | undefined {
  if (!transition || !eraOverride) {
    return transition;
  }
  return {
    ...transition,
    from: { ...transition.from, era: eraOverride },
    to: { ...transition.to, era: eraOverride }
  };
}
