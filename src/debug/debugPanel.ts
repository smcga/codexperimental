export function shouldShowEffectPanel(debugEnabled: boolean, forcedEffect: string | null): boolean {
  return debugEnabled && forcedEffect !== null;
}

export function getDebugEffectSelectorValue(forcedEffect: string | null): string {
  return forcedEffect ?? "timeline";
}

export function getDebugEffectSelectorOptions(effectNames: string[]): string[] {
  return ["timeline", ...effectNames];
}
