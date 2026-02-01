export function shouldShowEffectPanel(debugEnabled: boolean, forcedEffect: string | null): boolean {
  return debugEnabled && forcedEffect !== null;
}
