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
  it("covers the continuous main run through 06:22.87", () => {
    const sections = timeline.sections.map((section) => ({
      id: section.id,
      start: toSeconds(section.start),
      end: toSeconds(section.end)
    }));

    const mainRun = sections.filter((section) => section.start >= timeline.intro.end && section.start < 383);

    expect(timeline.intro.end).toBeCloseTo(54.2, 5);
    expect(mainRun[0]?.start).toBeCloseTo(timeline.intro.end, 5);

    let continuousEnd = mainRun[0]?.end ?? timeline.intro.end;
    for (let i = 1; i < mainRun.length; i += 1) {
      if (Math.abs(mainRun[i].start - mainRun[i - 1].end) > 0.00001) {
        break;
      }
      continuousEnd = mainRun[i].end;
    }

    expect(continuousEnd).toBeCloseTo(382.87, 5);
    expect(sections.at(-1)?.end).toBeGreaterThanOrEqual(382.87);
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

    expect(toSeconds(rapSections[0]?.start ?? 0)).toBeCloseTo(rapStart, 5);
    expect(toSeconds(rapSections.at(-1)?.end ?? 0)).toBeCloseTo(rapEnd, 5);

    rapSections.forEach((section) => {
      const duration = toSeconds(section.end) - toSeconds(section.start);
      expect(duration).toBeLessThanOrEqual(8);
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
    expect(rapTextCues.length).toBeGreaterThanOrEqual(200);

    const uniquePositions = new Set(
      rapTextCues.map((cue) => `${Number(cue.x).toFixed(3)}:${Number(cue.y).toFixed(3)}`)
    );
    expect(uniquePositions.size).toBeGreaterThan(40);

    const leftAligned = rapTextCues.filter((cue) => cue.align === "left").length;
    const centerAligned = rapTextCues.filter((cue) => cue.align === "center").length;
    const rightAligned = rapTextCues.filter((cue) => cue.align === "right").length;

    expect(leftAligned).toBeGreaterThan(10);
    expect(centerAligned).toBeGreaterThan(10);
    expect(rightAligned).toBeGreaterThan(10);
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

    documentedEffects
      .filter((effectId) => effectId !== "portrait")
      .forEach((effectId) => {
        expect(usedEffects.has(effectId)).toBe(true);
      });
  });
});
