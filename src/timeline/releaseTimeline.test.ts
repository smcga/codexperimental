import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

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

  it("honors sacred structure anchors and rush micro-switches", () => {
    const sectionStarts = new Set(timeline.sections.map((section) => toSeconds(section.start)));

    const anchors = [
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
      372.6
    ];

    anchors.forEach((anchor) => {
      expect(sectionStarts.has(anchor)).toBe(true);
    });

    const rushA = timeline.sections.filter((section) => section.id.startsWith("era16bit-rush1-"));
    const rushB = timeline.sections.filter((section) => section.id.startsWith("polygons-rush2-"));
    expect(rushA).toHaveLength(16);
    expect(rushB).toHaveLength(16);
  });

  it("defines an ideological rap chapter from 03:25.14 to 04:25.7 with <=5s switches", () => {
    const rapStart = 3 * 60 + 25.14;
    const rapEnd = 4 * 60 + 25.7;
    const rapSections = timeline.sections.filter((section) => {
      const start = toSeconds(section.start);
      const end = toSeconds(section.end);
      return end > rapStart && start < rapEnd;
    });

    expect(rapSections[0]?.start).toBe("03:25.14");
    expect(rapSections.at(-1)?.end).toBe("04:25.7");

    rapSections.forEach((section) => {
      const duration = toSeconds(section.end) - toSeconds(section.start);
      expect(duration).toBeLessThanOrEqual(5);
    });

    const rapEffects = new Set(rapSections.map((section) => section.effect));
    expect(rapEffects.has("sphere3d")).toBe(true);
    expect(rapEffects.has("infinitycloud")).toBe(true);
    expect(rapEffects.has("neon_alley")).toBe(true);

    const rapTextCues = timeline.textCues.filter((cue) => {
      const start = toSeconds(cue.start);
      const end = toSeconds(cue.end);
      return end > rapStart && start < rapEnd;
    });
    expect(rapTextCues.length).toBeGreaterThanOrEqual(2);
    expect(rapTextCues.length).toBeLessThanOrEqual(4);
  });

  it("uses every registered effect at least once as base or layer", () => {
    const usedEffects = new Set<string>();

    timeline.sections.forEach((section) => {
      usedEffects.add(section.effect);
      section.layers?.forEach((layer) => {
        usedEffects.add(layer.effect);
      });
    });

    const docsPath = new URL("../../docs/effects.md", import.meta.url);
    const docs = readFileSync(docsPath, "utf-8");
    const documentedEffects = Array.from(docs.matchAll(/^## Effect: (.+)$/gm), (match) => match[1]);

    documentedEffects.forEach((effectId) => {
      expect(usedEffects.has(effectId)).toBe(true);
    });
  });
});
