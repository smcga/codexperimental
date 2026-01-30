import { describe, expect, it } from "vitest";
import { dropTime, getActiveTextIndex, textWindows, effectWindows } from "../timeline";

describe("timeline", () => {
  it("returns correct active text index", () => {
    textWindows.forEach((window) => {
      expect(getActiveTextIndex(window.start + 0.1)).toBe(window.index);
    });
    expect(getActiveTextIndex(textWindows[0].start - 0.2)).toBe(-1);
  });

  it("schedules drop after line 6 appears", () => {
    const lineSixStart = textWindows[5].start;
    expect(dropTime).toBeGreaterThan(lineSixStart);
    expect(dropTime).toBeLessThanOrEqual(lineSixStart + 2);
  });

  it("keeps effects overlap within sane limits", () => {
    const duration = dropTime + 6;
    for (let t = 0; t <= duration; t += 0.5) {
      const active = effectWindows.filter((entry) => t >= entry.start && t <= entry.end);
      expect(active.length).toBeLessThanOrEqual(4);
      expect(active.length).toBeGreaterThan(0);
    }
  });
});
