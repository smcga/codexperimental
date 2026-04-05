import { SectionConfig, TextCue, TransitionType } from "../config/loadConfig";

export type DebugTransitionState = {
  from: SectionConfig;
  to: SectionConfig;
  progress: number;
  type: TransitionType;
};

export type DebugRenderSelection = {
  section: SectionConfig;
  transition: DebugTransitionState | undefined;
  textCues: TextCue[];
  isolateEffect: boolean;
};

export const DEBUG_PANEL_SECTIONS = ["transport", "effects", "render"] as const;
export type DebugPanelSection = (typeof DEBUG_PANEL_SECTIONS)[number];

export function shouldShowEffectPanel(debugEnabled: boolean, forcedEffect: string | null): boolean {
  return debugEnabled && forcedEffect !== null;
}

export function getDebugEffectSelectorValue(forcedEffect: string | null): string {
  return forcedEffect ?? "timeline";
}

export function getDebugEffectSelectorOptions(effectNames: string[]): string[] {
  return ["timeline", ...effectNames];
}

export function getDebugPanelSection(selected: string | null | undefined): DebugPanelSection {
  if (selected && (DEBUG_PANEL_SECTIONS as readonly string[]).includes(selected)) {
    return selected as DebugPanelSection;
  }
  return "transport";
}

export function getNextDebugEffectSelection(
  currentForcedEffect: string | null,
  selectedValue: string
): { forcedEffect: string | null; shouldReset: boolean } {
  const forcedEffect = selectedValue === "timeline" ? null : selectedValue;
  return {
    forcedEffect,
    shouldReset: forcedEffect !== null && forcedEffect !== currentForcedEffect
  };
}

export function formatEffectSettingsForTimeline(effectName: string, params: Record<string, unknown>): string {
  return JSON.stringify(
    {
      effect: effectName,
      params
    },
    null,
    2
  );
}

export function buildDebugRenderSelection(options: {
  section: SectionConfig;
  transition?: DebugTransitionState;
  textCues: TextCue[];
  forcedEffect: string | null;
  effectParams?: Record<string, number> | null;
  transitionOverride: TransitionType | null;
}): DebugRenderSelection {
  const { section, transition, textCues, forcedEffect, effectParams, transitionOverride } = options;
  const hasEffectOverrides = !!effectParams && Object.keys(effectParams).length > 0;

  if (!forcedEffect) {
    return {
      section,
      transition: transition
        ? {
            ...transition,
            type: transitionOverride ?? transition.type
          }
        : undefined,
      textCues,
      isolateEffect: false
    };
  }

  return {
    section: {
      ...section,
      effect: forcedEffect,
      params: hasEffectOverrides && effectParams ? { ...section.params, ...effectParams } : section.params,
      automation: [],
      layers: []
    },
    transition: undefined,
    textCues: [],
    isolateEffect: true
  };
}
