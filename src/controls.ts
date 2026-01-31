export type FullscreenAction = "enter" | "exit" | "noop";

export function getNextDebugOverlayVisibility(isVisible: boolean): boolean {
  return !isVisible;
}

export function getIntroSkipTime(introEnd: number, audioOffset: number, currentTime: number): number {
  const targetTime = Math.max(0, introEnd - audioOffset);
  return Math.max(currentTime, targetTime);
}

export function getSecondHalfSkipTime(secondHalfStart: number, audioOffset: number, currentTime: number): number {
  const targetTime = Math.max(0, secondHalfStart - audioOffset);
  return Math.max(currentTime, targetTime);
}

export function getFullscreenAction(
  fullscreenEnabled: boolean,
  fullscreenElement: Element | null
): FullscreenAction {
  if (fullscreenEnabled) {
    return fullscreenElement ? "exit" : "enter";
  }

  return "noop";
}
