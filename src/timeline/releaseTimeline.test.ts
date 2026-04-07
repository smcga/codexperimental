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
      transitionKeys.forEach((key) => {
        expect(counts.get(key)).toBeGreaterThan(0);
      });

      const values = [...counts.values()];
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(max - min, `${phase} transition spread should stay within one use`).toBeLessThanOrEqual(1);
    };

    assertRoughBalance(countUsage("in"), "in");
    assertRoughBalance(countUsage("out"), "out");
  });

  it("applies the MP3 sync compensation offset used for sacred anchor playback timing", () => {
    expect(timeline.audio.offset).toBeCloseTo(-0.128, 5);
  });

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
      145.9,
      147.0,
      173.8,
      189.6,
      205.012,
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

  it("defines an ideological rap chapter from 03:25.012 to 04:25.7 with <=5s switches", () => {
    const rapStart = 3 * 60 + 25.012;
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
    expect(earliestRapCueStart).toBeCloseTo(rapStart, 5);
  });

  it("keeps all timeline text cues inside the rap lyric window and runout", () => {
    const rapStart = 3 * 60 + 25.012;
    const lyricRunout = 4 * 60 + 26.79;
    const cueStarts = timeline.textCues.map((cue) => toSeconds(cue.start));
    const cueEnds = timeline.textCues.map((cue) => toSeconds(cue.end));

    expect(Math.min(...cueStarts)).toBeCloseTo(rapStart, 5);
    expect(Math.max(...cueEnds)).toBeCloseTo(lyricRunout, 5);
    timeline.textCues.forEach((cue) => {
      expect(toSeconds(cue.start)).toBeGreaterThanOrEqual(rapStart);
      expect(toSeconds(cue.end)).toBeLessThanOrEqual(lyricRunout);
    });
  });

  it("locks rap lyric text cues to the documented sacred lyric anchors", () => {
    const cueById = new Map(timeline.textCues.map((cue) => [cue.id, cue]));
    const expectedAnchors: Array<[string, number]> = [
      ["scene-023-lissajous-1", 205.012],
      ["scene-023-lissajous-8", 206.217],
      ["scene-023-lissajous-11", 206.605],
      ["scene-023-lissajous-13", 206.907],
      ["scene-023-lissajous-20", 207.772],
      ["scene-023-lissajous-22", 208.441],
      ["scene-023-lissajous-31", 209.629],
      ["scene-024-c64-raster-bars-1", 211.11],
      ["scene-024-c64-raster-bars-4", 211.47],
      ["scene-024-c64-raster-bars-9", 212.477],
      ["scene-024-c64-raster-bars-10", 213.151],
      ["scene-030-copper-gradient-splits-1", 214.173],
      ["scene-031-textured-cube-1", 215.168],
      ["scene-031-textured-cube-3-2", 216.033],
      ["scene-031-textured-cube-7-2", 217.043],
      ["scene-031-textured-cube-13", 218.577],
      ["scene-031-textured-cube-15", 218.948],
      ["scene-035-textmode-charset-2", 219.779],
      ["scene-035-textmode-charset-7", 221.457],
      ["scene-035-textmode-charset-9", 222.308],
      ["scene-035-textmode-charset-17", 223.83],
      ["scene-038-raytrace-spheres-8", 226.028],
      ["scene-038-raytrace-spheres-10", 226.712],
      ["scene-042-volumetric-clouds-2", 229.266],
      ["scene-042-volumetric-clouds-15", 232.477],
      ["scene-042-volumetric-clouds-20", 233.491],
      ["scene-046-amiga-showcase-2", 234.426],
      ["scene-047-kefrens-bars-1", 235.19],
      ["scene-047-kefrens-bars-6", 236.207],
      ["scene-047-kefrens-bars-10", 237.177],
      ["scene-047-kefrens-bars-11", 237.898],
      ["scene-048-equalizer-2", 238.91],
      ["scene-048-equalizer-6", 239.9],
      ["scene-048-equalizer-7", 240.342],
      ["scene-048-equalizer-8", 240.656],
      ["scene-048-equalizer-10", 241.255],
      ["scene-048-equalizer-15", 242.588],
      ["scene-048-equalizer-16", 243.334],
      ["scene-048-equalizer-19", 244.346],
      ["scene-053-kefrens-bars-1", 245.697],
      ["scene-053-kefrens-bars-7", 246.736],
      ["scene-056-amiga-showcase-3", 248.922],
      ["scene-056-amiga-showcase-7", 249.759],
      ["scene-056-amiga-showcase-11", 250.78],
      ["scene-056-amiga-showcase-14", 251.633],
      ["scene-056-amiga-showcase-19", 252.474],
      ["scene-060-flyover-1", 253.113],
      ["scene-060-flyover-5", 254.51],
      ["scene-060-flyover-10", 255.707],
      ["scene-060-flyover-16", 257.241],
      ["scene-064-textmode-charset-4", 258.58],
      ["scene-064-textmode-charset-11", 260.433],
      ["scene-064-textmode-charset-17", 261.453],
      ["scene-067-rain-2", 262.292],
      ["scene-067-rain-4", 262.984],
      ["scene-067-rain-9", 263.996]
    ];

    expectedAnchors.forEach(([id, time]) => {
      const cue = cueById.get(id);
      expect(cue).toBeDefined();
      expect(toSeconds(cue?.start ?? 0)).toBeCloseTo(time, 5);
    });

    expect(toSeconds(cueById.get("scene-067-rain-17")?.end ?? 0)).toBeCloseTo(266.79, 5);
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
        "models",
        "trained",
        "mate."
      ])
    );

    expect(words.indexOf("clickbait?")).toBeLessThan(words.indexOf("That"));
    expect(words.indexOf("problem")).toBeLessThan(words.indexOf("before"));
    expect(words.indexOf("any")).toBeLessThan(words.indexOf("models"));
  });


  it("keeps envmap donut timeline usage aligned with the new safe defaults", () => {
    const envmapEntries = timeline.sections.flatMap((section) => {
      const entries = [section, ...(section.layers ?? [])];
      return entries.filter((entry) => entry.effect === "envmap_donut");
    });

    expect(envmapEntries.length).toBeGreaterThan(0);

    envmapEntries.forEach((entry) => {
      expect(entry.params?.audioReact).toBe(0.0005);
      expect(entry.params?.beatKick).toBe(0);
      expect(entry.params?.backfaceCull).toBe(0);
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

    expect(toSeconds(preRapBuildup?.start ?? 0)).toBeCloseTo(3 * 60 + 9.6, 5);
    expect(toSeconds(preRapBuildup?.end ?? 0)).toBeCloseTo(3 * 60 + 15.7, 5);
    expect(toSeconds(dnbReturn?.start ?? 0)).toBeCloseTo(3 * 60 + 15.7, 5);
    expect(toSeconds(dnbReturn?.end ?? 0)).toBeCloseTo(3 * 60 + 24, 5);
    expect(toSeconds(drumFillLeadIn?.start ?? 0)).toBeCloseTo(3 * 60 + 24, 5);
    expect(toSeconds(drumFillLeadIn?.end ?? 0)).toBeCloseTo(3 * 60 + 25.012, 5);
    expect(toSeconds(rapLaunch?.start ?? 0)).toBeCloseTo(3 * 60 + 25.012, 5);
  });

  it("gives every registry effect a primary release spotlight", () => {
    const primaryEffects = new Set(timeline.sections.map((section) => section.effect));
    const registryEffects = getEffectRegistryKeys();

    registryEffects.forEach((effectId) => {
      expect(primaryEffects.has(effectId)).toBe(true);
    });
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
