import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { RawTimelineConfig, normalizeTimelineConfig } from "./loadConfig";

function createBaseConfig(): RawTimelineConfig {
  return {
    audio: { src: "/song.mp3", offset: 0 },
    intro: {
      mode: "terminal",
      end: 1,
      theme: {
        bg: "#000",
        fg: "#fff",
        accent: "#0f0",
        dim: "#666",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 14,
        padding: 10,
        window: {
          title: "demo",
          chrome: true
        }
      },
      script: [{ t: 0, type: "prompt", text: ">" }]
    },
    sections: [
      {
        id: "section-1",
        start: 1,
        end: 2,
        effect: "plasma"
      }
    ],
    textCues: []
  };
}

describe("normalizeTimelineConfig", () => {
  it("defaults section era to pcdemo", () => {
    const normalized = normalizeTimelineConfig(createBaseConfig());
    expect(normalized.sections[0].era).toBe("pcdemo");
  });

  it("accepts valid era presets", () => {
    const raw = createBaseConfig();
    raw.sections[0].era = "8bit";
    const normalized = normalizeTimelineConfig(raw);
    expect(normalized.sections[0].era).toBe("8bit");
  });


  it("accepts the signal-collapse and camera-punch-through transition types", () => {
    const raw = createBaseConfig();
    raw.sections[0].transition = { in: "signal-collapse", out: "camera-punch-through", duration: 0.6 };

    const normalized = normalizeTimelineConfig(raw);

    expect(normalized.sections[0].transition).toEqual({
      in: "signal-collapse",
      out: "camera-punch-through",
      duration: 0.6
    });
  });

  it("rejects invalid era presets", () => {
    const raw = createBaseConfig();
    raw.sections[0].era = "future-nope" as "pcdemo";
    expect(() => normalizeTimelineConfig(raw)).toThrow("sections[0].era must be one of");
  });

  it("normalizes the release timeline boundaries", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);
    const last = normalized.sections[normalized.sections.length - 1];

    expect(normalized.sections[0].start).toBeCloseTo(normalized.intro.end);
    expect(last.end).toBeGreaterThan(normalized.sections[0].start);
  });

  it("includes hook hit sections and text cues in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const hookSection = normalized.sections.find((section) => section.id === "hook-hit-01160");
    const lateHookSection = normalized.sections.find((section) => section.id === "rap-hook-hit-03520");
    const hookText = normalized.textCues?.find((cue) => cue.id === "this-hit-00542");
    const lateHookText = normalized.textCues?.find((cue) => cue.id === "this-hit-04407");

    expect(hookSection?.start).toBeCloseTo(76.62);
    expect(hookSection?.end).toBeCloseTo(78.8);
    expect(lateHookSection?.start).toBeCloseTo(229.2);
    expect(lateHookSection?.end).toBeCloseTo(234.0);
    expect(hookText?.start).toBeCloseTo(54.2);
    expect(lateHookText?.start).toBeCloseTo(280.73);
  });

  it("features the wireframe ride and mutation sections in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const wireframeRide = normalized.sections.find((section) => section.id === "rap-switch-a-03560");
    const mutation = normalized.sections.find((section) => section.id === "mega-drop-mutation");

    expect(wireframeRide?.effect).toBe("sphere3d");
    expect(wireframeRide?.start).toBeCloseTo(234.0);
    expect(wireframeRide?.end).toBeCloseTo(238.8);

    expect(mutation?.effect).toBe("effect_evolution");
    expect(mutation?.start).toBeCloseTo(302.4);
    expect(mutation?.end).toBeCloseTo(319.66);
  });

  it("captures both rush micro-switch ramps in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const rushA = normalized.sections.filter((section) => section.id.startsWith("era16bit-rush1-"));
    const rushB = normalized.sections.filter((section) => section.id.startsWith("polygons-rush2-"));

    expect(rushA).toHaveLength(16);
    expect(rushB).toHaveLength(16);

    expect(rushA[0]?.start).toBeCloseTo(106.27);
    expect(rushA.at(-1)?.end).toBeCloseTo(108.56);
    expect(rushB[0]?.start).toBeCloseTo(171.1);
    expect(rushB.at(-1)?.end).toBeCloseTo(173.8);

    [rushA, rushB].forEach((rushSections) => {
      rushSections.forEach((section) => {
        expect(section.layers?.[0]?.effect).toBe("feedback");
        expect(section.layers?.[0]?.opacity).toBeGreaterThanOrEqual(0.1);
      });
    });
  });

  it("uses rain and lightning as layered effects in the main timeline", () => {
    const timelinePath = new URL("../../public/timeline.json", import.meta.url);
    const raw = JSON.parse(readFileSync(timelinePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const rainLayerCounts = normalized.sections.map(
      (section) => section.layers?.filter((layer) => layer.effect === "rain").length ?? 0
    );
    const rainSections = normalized.sections.filter(
      (section) => (section.layers?.some((layer) => layer.effect === "rain") ?? false)
    );
    const lightningSections = normalized.sections.filter(
      (section) => (section.layers?.some((layer) => layer.effect === "lightning") ?? false)
    );

    expect(Math.max(...rainLayerCounts)).toBeGreaterThanOrEqual(1);
    expect(lightningSections.length).toBeGreaterThan(0);
    expect(rainSections[0]?.start ?? Number.POSITIVE_INFINITY).toBeLessThan(180);
    expect(lightningSections[0]?.start ?? Number.POSITIVE_INFINITY).toBeLessThan(180);
  });

  it("keeps generated scene naming/layering polished in the main timeline", () => {
    const timelinePath = new URL("../../public/timeline.json", import.meta.url);
    const raw = JSON.parse(readFileSync(timelinePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const legacySections = normalized.sections.filter((section) => section.id.startsWith("New Section"));
    const generatedScenes = normalized.sections.filter((section) => section.id.startsWith("Scene "));

    expect(legacySections).toHaveLength(0);
    expect(normalized.sections.some((section) => section.effect === "portrait")).toBe(false);
    expect(generatedScenes.length).toBeGreaterThan(0);

    generatedScenes.forEach((section) => {
      expect(section.layers.length).toBeGreaterThan(0);
      expect(section.automation.length).toBeGreaterThan(0);
    });
  });

  it("keeps rap chapter cues visually varied without retiming lyrics", () => {
    const timelinePath = new URL("../../public/timeline.json", import.meta.url);
    const raw = JSON.parse(readFileSync(timelinePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const rapStart = 3 * 60 + 25.14;
    const rapEnd = 4 * 60 + 25.7;
    const rapCues = normalized.textCues.filter((cue) => cue.end > rapStart && cue.start < rapEnd);

    expect(rapCues.length).toBeGreaterThan(200);
    expect(new Set(rapCues.map((cue) => cue.align)).size).toBeGreaterThanOrEqual(3);
    expect(new Set(rapCues.map((cue) => cue.x.toFixed(2))).size).toBeGreaterThanOrEqual(5);
    expect(new Set(rapCues.map((cue) => cue.y.toFixed(2))).size).toBeGreaterThanOrEqual(5);
    expect(Math.max(...rapCues.map((cue) => cue.size))).toBeGreaterThanOrEqual(56);

    const typewriterCount = rapCues.filter((cue) => cue.effects.typewriter).length;
    const glitchCount = rapCues.filter((cue) => cue.effects.glitchIn).length;
    expect(typewriterCount).toBeGreaterThan(40);
    expect(glitchCount).toBeGreaterThan(80);

    const lineGroups: typeof rapCues[] = [];
    let currentLine: typeof rapCues = [];
    rapCues.forEach((cue) => {
      currentLine.push(cue);
      const cueText = (cue.text ?? cue.spans[0]?.text ?? "").trim();
      if (/[.?!…]['’”"]?$/.test(cueText)) {
        lineGroups.push(currentLine);
        currentLine = [];
      }
    });
    if (currentLine.length > 0) {
      lineGroups.push(currentLine);
    }

    lineGroups.forEach((line) => {
      if (line.length < 2) {
        return;
      }
      for (let i = 1; i < line.length; i += 1) {
        expect(line[i].y).toBeGreaterThanOrEqual(line[i - 1].y);
      }
      expect(line[0].y).toBeLessThanOrEqual(0.25);
      expect(line.at(-1)?.y ?? 1).toBeGreaterThanOrEqual(0.7);
    });
  });
});

it("defaults section framing to auto and accepts explicit override", () => {
  const base = createBaseConfig();
  base.sections[0].framing = "mobileFit";
  const normalized = normalizeTimelineConfig(base);

  expect(normalized.sections[0].framing).toBe("mobileFit");

  const autoNormalized = normalizeTimelineConfig(createBaseConfig());
  expect(autoNormalized.sections[0].framing).toBe("auto");
});


it("normalizes fitAlign values and defaults to fill", () => {
  const base = createBaseConfig();
  base.sections[0].fitAlign = "center";
  base.sections[0].layers = [{ effect: "chess", fitAlign: "top" }];

  const normalized = normalizeTimelineConfig(base);

  expect(normalized.sections[0].fitAlign).toBe("centre");
  expect(normalized.sections[0].layers[0]?.fitAlign).toBe("top");

  const defaults = normalizeTimelineConfig(createBaseConfig());
  expect(defaults.sections[0].fitAlign).toBe("fill");
});

it("preserves optional text safe settings", () => {
  const base = createBaseConfig();
  base.textCues = [
    {
      id: "cue-safe",
      start: 1.2,
      text: "hello world",
      safe: true,
      maxWidth: 123
    }
  ];
  const normalized = normalizeTimelineConfig(base);

  expect(normalized.textCues[0].safe).toBe(true);
  expect(normalized.textCues[0].maxWidth).toBe(123);
});
