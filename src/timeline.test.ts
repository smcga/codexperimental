import { describe, expect, it } from "vitest";
import {
  STORY_LINES,
  getActiveLineIndex,
  lineStarts,
  dropTime,
  effectWindows
} from "./timeline";

describe("timeline", () => {
  it("returns correct active text index for key times", () => {
    expect(getActiveLineIndex(0)).toBe(0);
    expect(getActiveLineIndex(lineStarts[1] + 0.2)).toBe(1);
    expect(getActiveLineIndex(lineStarts[2] + 0.1)).toBe(2);
    expect(getActiveLineIndex(lineStarts[5] + 0.05)).toBe(5);
    expect(getActiveLineIndex(lineStarts[5] + 1.5)).toBe(5);
    expect(getActiveLineIndex(lineStarts[STORY_LINES.length - 1] + 0.2)).toBe(5);
  });

  it("drop happens after final line and within 2 seconds", () => {
    const finalStart = lineStarts[STORY_LINES.length - 1];
    expect(dropTime).toBeGreaterThan(finalStart);
    expect(dropTime - finalStart).toBeLessThanOrEqual(2);
  });

  it("effect windows are sane", () => {
    effectWindows.forEach((window) => {
      expect(window.end).toBeGreaterThan(window.start);
      expect(window.start).toBeGreaterThanOrEqual(0);
    });
    const overlapping = effectWindows.filter((window) => window.name !== "particles");
    const maxOverlap = overlapping.reduce((max, window) => {
      const overlapCount = overlapping.filter(
        (other) => window !== other && other.start < window.end && other.end > window.start
      ).length;
      return Math.max(max, overlapCount);
    }, 0);
    expect(maxOverlap).toBeLessThan(3);
  });
});
