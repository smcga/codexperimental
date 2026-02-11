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

  it("pins all sacred structural timestamps as section boundaries", () => {
    const sacredTimestamps = [
      54.2,
      76.62,
      98.3,
      109.16,
      120.03,
      130.8,
      149.85,
      152.5,
      173.8,
      189.6,
      205.14,
      265.7,
      272.15,
      280.73,
      302.4,
      319.66,
      325.39,
      340.0,
      372.6,
      382.87
    ];

    const boundaries = new Set<number>();
    timeline.sections.forEach((section) => {
      boundaries.add(toSeconds(section.start));
      boundaries.add(toSeconds(section.end));
    });

    sacredTimestamps.forEach((timestamp) => {
      const hasBoundary = Array.from(boundaries).some(
        (boundary) => Math.abs(boundary - timestamp) < 1e-6
      );
      expect(hasBoundary).toBe(true);
    });
  });

  it("builds the rap chapter from 03:25.14 to 04:25.7 with focused text cues", () => {
    const rapStart = 3 * 60 + 25.14;
    const rapEnd = 4 * 60 + 25.7;

    const rapSections = timeline.sections.filter((section) => {
      const start = toSeconds(section.start);
      const end = toSeconds(section.end);
      return end > rapStart && start < rapEnd;
    });

    expect(toSeconds(rapSections[0]?.start ?? 0)).toBeCloseTo(rapStart, 5);
    expect(toSeconds(rapSections.at(-1)?.end ?? 0)).toBeCloseTo(rapEnd, 5);
    expect(rapSections.length).toBeGreaterThanOrEqual(7);

    const rapTextCues = timeline.textCues.filter((cue) => {
      const start = toSeconds(cue.start);
      const end = toSeconds(cue.end);
      return end > rapStart && start < rapEnd;
    });

    expect(rapTextCues.length).toBeGreaterThanOrEqual(2);
    expect(rapTextCues.length).toBeLessThanOrEqual(4);
  });

  it("uses a high-impact WebGL base at the 04:40.73 drop", () => {
    const dropStart = 4 * 60 + 40.73;
    const section = timeline.sections.find(
      (candidate) =>
        toSeconds(candidate.start) >= dropStart &&
        toSeconds(candidate.start) <= dropStart + 0.2 &&
        candidate.effect === "raymarch_fractal"
    );

    expect(section).toBeDefined();
  });
});
