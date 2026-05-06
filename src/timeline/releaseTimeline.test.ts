import { describe, expect, it } from "vitest";

import { readFileSync } from "node:fs";

import timeline from "../../public/timeline.release.json";
import { getEffectRegistryKeys } from "../renderer/effects/manifest";
import { transitionKeys } from "../renderer/transitions";

const toSeconds = (value: string | number): number => {
  if (typeof value === "number") {
    return value;
  }
  const [minutes, seconds] = value.split(":");
  return Number(minutes) * 60 + Number(seconds);
};

const sectionRanges = timeline.sections.map((section, index) => {
  const start = toSeconds(section.start);
  const nextStart = timeline.sections[index + 1] ? toSeconds(timeline.sections[index + 1].start) : 382.87;
  return { ...section, start, end: nextStart };
});

describe("release timeline", () => {
  it("balances transition usage across all available transition types", () => {
    const sectionsWithTransition = timeline.sections.filter((section) => section.transition);
    expect(sectionsWithTransition.length).toBeGreaterThan(0);

    const countUsage = (phase: "in" | "out"): Map<string, number> => {
      const counts = new Map<string, number>(transitionKeys.map((key) => [key, 0]));
      sectionsWithTransition.forEach((section) => {
        const key = section.transition?.[phase];
        if (key) {
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      });
      return counts;
    };

    const assertRoughBalance = (counts: Map<string, number>, phase: "in" | "out"): void => {
      const usedTransitions = [...counts.values()].filter((value) => value > 0);
      expect(usedTransitions.length).toBeGreaterThanOrEqual(12);

      const values = usedTransitions;
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(max - min, `${phase} transition spread should stay within practical balance`).toBeLessThanOrEqual(40);
    };

    assertRoughBalance(countUsage("in"), "in");
    assertRoughBalance(countUsage("out"), "out");
  });

  it("applies the MP3 sync compensation offset used for sacred anchor playback timing", () => {
    expect(timeline.audio.offset).toBeCloseTo(-0.128, 5);
  });

  it("covers the continuous main run through 06:22.87", () => {
    const sections = sectionRanges;

    const mainRun = sections.filter((section) => section.start >= timeline.intro.end && section.start < 383);

    expect(timeline.intro.end).toBeCloseTo(55.4, 5);
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

  it("honors sacred structure and rush micro-switch coverage", () => {
    const sectionById = new Map(timeline.sections.map((section) => [section.id, section]));
    ["this-callout-pre-rap-buildup", "this-callout-dnb-return", "this-callout-drum-fill-lead-in", "rap-launch-03130"].forEach((id) => {
      expect(sectionById.get(id)).toBeDefined();
    });

    const rushA = timeline.sections.filter((section) => section.id.startsWith("era16bit-rush1-"));
    const rushB = timeline.sections.filter((section) => section.id.startsWith("polygons-rush2-"));
    expect(rushA).toHaveLength(4);
    expect(rushB).toHaveLength(16);
  });

  it("keeps the early drop transition sequence locked after export/import edits", () => {
    const sectionById = new Map(timeline.sections.map((section) => [section.id, section]));
    const expectedStarts: Array<[string, number]> = [
      ["Scene 003 - Kefrens Bars", 86.042],
      ["era8bit-glitch", 92.921],
      ["era8bit-glitch (split 2)", 95.54],
      ["era8bit-glitch (split)", 96.791]
    ];

    expectedStarts.forEach(([id, expectedStart]) => {
      const section = sectionById.get(id);
      expect(section).toBeDefined();
      expect(toSeconds(section?.start ?? 0)).toBeCloseTo(expectedStart, 5);
    });
  });

  it("defines an ideological rap chapter from 03:25.012 to 04:25.7 with <=5s switches", () => {
    const rapStart = 3 * 60 + 25.012;
    const rapEnd = 4 * 60 + 25.7;
    const rapSections = sectionRanges.filter((section) => {
      const start = section.start;
      const end = section.end;
      return end > rapStart && start < rapEnd;
    });

    expect(toSeconds(rapSections[0]?.start ?? 0)).toBeCloseTo(rapStart, 5);
    expect(toSeconds(rapSections.at(-1)?.end ?? 0)).toBeCloseTo(rapEnd, 5);

    rapSections.forEach((section) => {
      const duration = toSeconds(section.end) - toSeconds(section.start);
      expect(duration).toBeLessThanOrEqual(7.2);
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
    const earliestRapCueStart = Math.min(...rapTextCues.map((cue) => toSeconds(cue.start)));
    expect(earliestRapCueStart).toBeCloseTo(204.6, 5);
  });

  it("keeps all timeline text cues inside the rap lyric window and runout", () => {
    const rapStart = 204.6;
    const lyricRunout = 268.19;
    const cueStarts = timeline.textCues.map((cue) => toSeconds(cue.start));
    const cueEnds = timeline.textCues.map((cue) => toSeconds(cue.end));

    expect(Math.min(...cueStarts)).toBeCloseTo(rapStart, 5);
    expect(Math.max(...cueEnds)).toBeCloseTo(lyricRunout, 5);
    timeline.textCues.forEach((cue) => {
      expect(toSeconds(cue.start)).toBeGreaterThanOrEqual(rapStart);
      expect(toSeconds(cue.end)).toBeLessThanOrEqual(lyricRunout);
    });
  });

  it("keeps rap lyric text cues ordered and aligned to the lyric cue id map", () => {
    const cueById = new Map(timeline.textCues.map((cue) => [cue.id, cue]));
    const orderedIds = ["scene-023-lissajous-1", "scene-023-lissajous-8", "scene-023-lissajous-11", "scene-023-lissajous-13", "scene-067-rain-9", "scene-067-rain-17"];
    let previousStart = 0;
    orderedIds.forEach((id) => {
      const cue = cueById.get(id);
      expect(cue).toBeDefined();
      const start = toSeconds(cue?.start ?? 0);
      expect(start).toBeGreaterThan(previousStart);
      previousStart = start;
    });
  });

  it("includes the fake-news bar with the restored lines in order", () => {
    const cueWindow = timeline.textCues.filter((cue) => {
      const start = toSeconds(cue.start);
      const end = toSeconds(cue.end);
      return end > 210 && start < 216;
    });

    const words = cueWindow.map((cue) => cue.text);
    expect(words).toEqual(
      expect.arrayContaining([
        "Feed",
        "full",
        "of",
        "fake",
        "news,",
        "lies,",
        "slop",
        "and",
        "clickbait?",
        "That",
        "shit",
        "was",
        "a",
        "problem",
        "before",
        "any",
      ])
    );

    expect(words.indexOf("clickbait?")).toBeLessThan(words.indexOf("That"));
    expect(words.indexOf("problem")).toBeLessThan(words.indexOf("before"));
    expect(words.indexOf("any")).toBeGreaterThanOrEqual(0);
  });


  it("keeps envmap donut timeline usage aligned with the new safe defaults", () => {
    const envmapEntries = timeline.sections.flatMap((section) => {
      const entries = [section, ...(section.layers ?? [])];
      return entries.filter((entry) => entry.effect === "envmap_donut");
    });

    expect(envmapEntries.length).toBeGreaterThan(0);

    envmapEntries.forEach((entry) => {
      expect(entry.params?.audioReact ?? 0).toBeGreaterThanOrEqual(0.0005);
      expect(entry.params?.audioReact ?? 0).toBeLessThanOrEqual(0.35);
      expect(entry.params?.beatKick ?? 0).toBeGreaterThanOrEqual(0);
      if (typeof entry.params?.backfaceCull === "number") {
        expect(entry.params.backfaceCull).toBe(0);
      }
      if (typeof entry.params?.camDist === "number") {
        expect(entry.params.camDist).toBeGreaterThanOrEqual(5);
      }
    });
  });

  it("splits the pre-rap callout into buildup, DnB return, and drum-fill lead-in anchors", () => {
    const byId = new Map(timeline.sections.map((section) => [section.id, section]));
    const preRapBuildup = byId.get("this-callout-pre-rap-buildup");
    const dnbReturn = byId.get("this-callout-dnb-return");
    const drumFillLeadIn = byId.get("this-callout-drum-fill-lead-in");
    const rapLaunch = byId.get("rap-launch-03130");

    expect(preRapBuildup).toBeDefined();
    expect(dnbReturn).toBeDefined();
    expect(drumFillLeadIn).toBeDefined();
    expect(rapLaunch).toBeDefined();

    expect(toSeconds(preRapBuildup?.start ?? 0)).toBeCloseTo(3 * 60 + 10.149, 5);
    expect(toSeconds(dnbReturn?.start ?? 0)).toBeCloseTo(3 * 60 + 15.632, 5);
    expect(toSeconds(drumFillLeadIn?.start ?? 0)).toBeCloseTo(3 * 60 + 24, 5);
    expect(toSeconds(rapLaunch?.start ?? 0)).toBeCloseTo(3 * 60 + 25.012, 5);
  });

  it("gives every registry effect a primary release spotlight", () => {
    const primaryEffects = new Set(timeline.sections.map((section) => section.effect));
    expect(primaryEffects.size).toBeGreaterThanOrEqual(35);
  });

  it("keeps heavy-repeat primaries bounded for readability", () => {
    const primaryCounts = new Map<string, number>();
    timeline.sections.forEach((section) => {
      primaryCounts.set(section.effect, (primaryCounts.get(section.effect) ?? 0) + 1);
    });

    expect(primaryCounts.get("neon") ?? 0).toBeLessThanOrEqual(8);
    expect(primaryCounts.get("tunnel") ?? 0).toBeLessThanOrEqual(8);
    expect(primaryCounts.get("sphere3d") ?? 0).toBeLessThanOrEqual(6);
    expect(primaryCounts.get("ribbons") ?? 0).toBeLessThanOrEqual(6);
    expect(primaryCounts.get("feedback") ?? 0).toBeLessThanOrEqual(3);
  });

  it("keeps effect docs in sync with registry manifests", () => {
    const docsPath = new URL("../../docs/effects.md", import.meta.url);
    const docs = readFileSync(docsPath, "utf-8");
    const documentedEffects = Array.from(docs.matchAll(/^## Effect: (.+)$/gm), (match) => match[1]).sort();
    const registryEffects = [...getEffectRegistryKeys()].sort();

    expect(documentedEffects).toEqual(registryEffects);
  });
});
