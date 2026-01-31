export type FullscreenAction = "enter" | "exit" | "enter-fallback" | "exit-fallback" | "noop";

export function getNextDebugOverlayVisibility(isVisible: boolean): boolean {
  return !isVisible;
}

export function getFullscreenAction(
  fullscreenEnabled: boolean,
  fullscreenElement: Element | null,
  fallbackEnabled: boolean,
  fallbackActive: boolean
): FullscreenAction {
  if (fullscreenEnabled) {
    return fullscreenElement ? "exit" : "enter";
  }

  if (fallbackEnabled) {
    return fallbackActive ? "exit-fallback" : "enter-fallback";
  }

  return "noop";
}
