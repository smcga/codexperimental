export function shouldShowFlyoverPanel(debugEnabled: boolean, forcedEffect: string | null): boolean {
  return debugEnabled && forcedEffect === "flyover";
}
