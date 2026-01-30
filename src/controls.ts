export type FullscreenAction = "enter" | "exit" | "noop";

export function getNextDebugOverlayVisibility(isVisible: boolean): boolean {
  return !isVisible;
}

export function getFullscreenAction(
  fullscreenEnabled: boolean,
  fullscreenElement: Element | null
): FullscreenAction {
  if (!fullscreenEnabled) {
    return "noop";
  }

  return fullscreenElement ? "exit" : "enter";
}
