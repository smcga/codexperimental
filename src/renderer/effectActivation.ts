import { SectionConfig } from "../config/loadConfig";

export const addSectionEffects = (effectNames: Set<string>, section: SectionConfig): void => {
  effectNames.add(section.effect);
  section.layers.forEach((layer) => {
    effectNames.add(layer.effect);
  });
};

export const collectActiveEffectNames = (
  section: SectionConfig,
  transition?: {
    from: SectionConfig;
    to: SectionConfig;
  }
): Set<string> => {
  const effectNames = new Set<string>();
  if (transition) {
    addSectionEffects(effectNames, transition.from);
    addSectionEffects(effectNames, transition.to);
    return effectNames;
  }
  addSectionEffects(effectNames, section);
  return effectNames;
};

export const resetNewlyActivatedEffects = (
  previousEffectNames: ReadonlySet<string>,
  nextEffectNames: ReadonlySet<string>,
  registry: Record<string, { reset?: () => void }>
): void => {
  nextEffectNames.forEach((effectName) => {
    if (!previousEffectNames.has(effectName)) {
      registry[effectName]?.reset?.();
    }
  });
};
