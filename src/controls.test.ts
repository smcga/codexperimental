import { describe, expect, it } from "vitest";

import {
  getEditorShortcutAction,
  getEndSkipTime,
  getRelativeSeekTime,
  getSecondHalfSkipTime,
  shouldHandleGlobalShortcut
} from "./controls";

describe("getSecondHalfSkipTime", () => {
  it("skips forward to the configured second-half time", () => {
    expect(getSecondHalfSkipTime(150, 0, 10)).toBe(150);
  });

  it("does not rewind when already past the second half", () => {
    expect(getSecondHalfSkipTime(150, 0, 180)).toBe(180);
  });

  it("accounts for audio offsets", () => {
    expect(getSecondHalfSkipTime(150, 5, 100)).toBe(145);
  });
});

describe("getRelativeSeekTime", () => {
  it("moves forward by the delta when duration is known", () => {
    expect(getRelativeSeekTime(12, 10, 100)).toBe(22);
  });

  it("clamps to zero when rewinding past the start", () => {
    expect(getRelativeSeekTime(4, -10, 100)).toBe(0);
  });

  it("clamps to duration when seeking past the end", () => {
    expect(getRelativeSeekTime(98, 10, 100)).toBe(100);
  });

  it("does not clamp to duration when duration is unknown", () => {
    expect(getRelativeSeekTime(5, 10, 0)).toBe(15);
  });
});

describe("getEndSkipTime", () => {
  it("skips to just before the track end by default", () => {
    expect(getEndSkipTime(50, 180)).toBe(179.9);
  });

  it("does not rewind when already at the end", () => {
    expect(getEndSkipTime(179.95, 180)).toBe(179.95);
  });

  it("returns current time when duration is unknown", () => {
    expect(getEndSkipTime(42, 0)).toBe(42);
  });
});

describe("shouldHandleGlobalShortcut", () => {
  it("allows shortcuts when keydown does not target an editable element", () => {
    expect(shouldHandleGlobalShortcut({ tagName: "div" } as EventTarget)).toBe(true);
  });

  it("blocks shortcuts while typing in native form controls", () => {
    expect(shouldHandleGlobalShortcut({ tagName: "input" } as EventTarget)).toBe(false);
    expect(shouldHandleGlobalShortcut({ tagName: "textarea" } as EventTarget)).toBe(false);
    expect(shouldHandleGlobalShortcut({ tagName: "select" } as EventTarget)).toBe(false);
  });

  it("blocks shortcuts while typing in contenteditable regions", () => {
    expect(shouldHandleGlobalShortcut({ tagName: "div", isContentEditable: true } as EventTarget)).toBe(false);
  });

  it("blocks shortcuts when the target is nested inside editable content", () => {
    const target = {
      tagName: "span",
      closest: (selector: string) => (selector.includes("contenteditable") ? {} : null)
    } as EventTarget;
    expect(shouldHandleGlobalShortcut(target)).toBe(false);
  });
});


describe("getEditorShortcutAction", () => {
  it("maps spacebar to play/pause toggle", () => {
    expect(getEditorShortcutAction(" ")).toBe("toggle-playback");
  });

  it("maps left/right arrows to 3-second seek actions", () => {
    expect(getEditorShortcutAction("ArrowLeft")).toBe("seek-backward");
    expect(getEditorShortcutAction("ArrowRight")).toBe("seek-forward");
  });

  it("returns null for unrelated keys", () => {
    expect(getEditorShortcutAction("Enter")).toBeNull();
  });
});
