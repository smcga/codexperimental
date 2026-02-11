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
  it("covers continuously from intro end through 06:22.87", () => {
    const sections = timeline.sections.map((section) => ({
      id: section.id,
      start: toSeconds(section.start),
      end: toSeconds(section.end)
    }));

    expect(timeline.intro.end).toBeCloseTo(54.2, 5);
    expect(sections[0]?.start).toBeCloseTo(timeline.intro.end, 5);
    for (let i = 1; i < sections.length; i += 1) {
      expect(sections[i].start).toBeCloseTo(sections[i - 1].end, 5);
    }
    expect(sections.at(-1)?.end).toBeCloseTo(382.87, 5);
  });

  it("honours required anchor and micro switch boundaries", () => {
    const starts = new Set(timeline.sections.map((section) => section.start));
    const requiredStarts = [
      "00:54.2",
      "01:16.62",
      "01:24.47",
      "01:38.3",
      "01:49.16",
      "02:00.03",
      "02:10.8",
      "02:22.4",
      "02:29.85",
      "02:32.5",
      "02:53.8",
      "03:25.14",
      "04:25.7",
      "04:32.15",
      "04:40.73",
      "05:19.66",
      "06:12.6"
    ];

    requiredStarts.forEach((start) => {
      expect(starts.has(start)).toBe(true);
    });
  });

  it("defines a grime/drill rap chapter from 03:25.14 to 04:25.7", () => {
    const rapStart = 3 * 60 + 25.14;
    const rapEnd = 4 * 60 + 25.7;
    const rapSections = timeline.sections.filter((section) => {
      const start = toSeconds(section.start);
      const end = toSeconds(section.end);
      return end > rapStart && start < rapEnd;
    });

    expect(rapSections[0]?.start).toBe("03:25.14");
    expect(rapSections.at(-1)?.end).toBe("04:25.7");

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
    expect(rapTextCues.length).toBeLessThanOrEqual(4);
  });

  it("contains required punch text cues with glitch + shadow", () => {
    const required = [
      ["01:05.10", "THIS"],
      ["01:16.62", "THIS"],
      ["01:24.47", "THIS"],
      ["01:35.60", "F***ING"],
      ["01:36.90", "COOL"],
      ["02:22.40", "THIS"],
      ["02:37.60", "THIS"],
      ["02:43.40", "THIS"],
      ["02:48.50", "THIS"]
    ] as const;

    required.forEach(([start, text]) => {
      const cue = timeline.textCues.find((item) => item.start === start && item.text === text);
      expect(cue).toBeDefined();
      expect(cue?.effects?.glitchIn).toBe(true);
      expect(cue?.effects?.shadow).toBe(true);
    });
  });
});
