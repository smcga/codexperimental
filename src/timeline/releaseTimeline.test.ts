import { describe, expect, it } from "vitest";

import timeline from "../../public/timeline.release.json";

const toSeconds = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }
  const [minutes, seconds] = value.split(":");
  return Number(minutes) * 60 + Number(seconds);
};

describe("release timeline", () => {
  it("covers continuously from intro end through 06:05.0", () => {
    const sections = timeline.sections.map((section) => ({
      id: section.id,
      start: toSeconds(section.start),
      end: toSeconds(section.end)
    }));

    expect(sections[0]?.start).toBeCloseTo(timeline.intro.end, 5);
    for (let i = 1; i < sections.length; i += 1) {
      expect(sections[i].start).toBeCloseTo(sections[i - 1].end, 5);
    }
    expect(sections.at(-1)?.end).toBeCloseTo(365.0, 5);
  });

  it("defines a coherent rap chapter from 03:13.0 to 04:13.0", () => {
    const rapStart = 3 * 60 + 13;
    const rapEnd = 4 * 60 + 16.5;
    const rapSections = timeline.sections.filter((section) => {
      const start = toSeconds(section.start);
      const end = toSeconds(section.end);
      return end > rapStart && start < rapEnd;
    });

    expect(rapSections[0]?.start).toBe("03:13.0");
    expect(rapSections.at(-1)?.end).toBe("04:16.5");

    const rapEffects = new Set(rapSections.map((section) => section.effect));
    expect(rapEffects.has("dotTunnel")).toBe(true);
    expect(rapEffects.has("lens_wobbler")).toBe(true);
    expect(rapEffects.has("raymarch_fractal")).toBe(true);

    const rapTextCues = timeline.textCues.filter((cue) => {
      const start = toSeconds(cue.start);
      const end = toSeconds(cue.end);
      return end > rapStart && start < rapEnd;
    });
    expect(rapTextCues.length).toBeGreaterThanOrEqual(2);
  });
});
