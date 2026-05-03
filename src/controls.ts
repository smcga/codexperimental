import { clamp } from "./util/math";

export type FullscreenAction = "enter" | "exit" | "noop";

export function getNextDebugOverlayVisibility(isVisible: boolean): boolean {
  return !isVisible;
}

export function getDebugOverlayVisibilityAfterEditorToggle(isEditorEnabled: boolean, isDebugOverlayVisible: boolean): boolean {
  if (isEditorEnabled) {
    return false;
  }
  return isDebugOverlayVisible;
}

export function getIntroSkipTime(introEnd: number, audioOffset: number, currentTime: number): number {
  const targetTime = Math.max(0, introEnd - audioOffset);
  return Math.max(currentTime, targetTime);
}

export function getSecondHalfSkipTime(secondHalfStart: number, audioOffset: number, currentTime: number): number {
  const targetTime = Math.max(0, secondHalfStart - audioOffset);
  return Math.max(currentTime, targetTime);
}

export function getEndSkipTime(currentTime: number, duration: number, endPadding = 0.1): number {
  if (duration <= 0) {
    return currentTime;
  }
  const targetTime = Math.max(0, duration - endPadding);
  return Math.max(currentTime, targetTime);
}

export function getRelativeSeekTime(currentTime: number, deltaSeconds: number, duration: number): number {
  const nextTime = currentTime + deltaSeconds;
  if (duration > 0) {
    return clamp(nextTime, 0, duration);
  }
  return Math.max(0, nextTime);
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

type EventTargetLike = {
  tagName?: unknown;
  isContentEditable?: unknown;
  closest?: unknown;
};

const EDITABLE_TARGET_SELECTOR =
  "input, textarea, select, [contenteditable=''], [contenteditable='true'], [contenteditable='plaintext-only']";

export function shouldHandleGlobalShortcut(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return true;
  }

  const targetLike = target as EventTargetLike;
  const tagName = typeof targetLike.tagName === "string" ? targetLike.tagName.toLowerCase() : "";
  if (tagName === "input" || tagName === "textarea" || tagName === "select") {
    return false;
  }

  if (targetLike.isContentEditable === true) {
    return false;
  }

  if (typeof targetLike.closest === "function") {
    const ancestor = (targetLike.closest as (selector: string) => unknown)(EDITABLE_TARGET_SELECTOR);
    if (ancestor) {
      return false;
    }
  }

  return true;
}

export function isPlayPauseShortcutKey(key: string, code: string): boolean {
  return key === " " || key.toLowerCase() === "spacebar" || code === "Space";
}
