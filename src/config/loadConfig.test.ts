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
    expect(last.end).toBeCloseTo(330);
  });

  it("includes hook hit sections and text cues in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const hookSection = normalized.sections.find((section) => section.id === "hook-hit-01160");
    const lateHookSection = normalized.sections.find((section) => section.id === "hook-hit-03470");
    const hookText = normalized.textCues?.find((cue) => cue.id === "this-hit-01160");
    const lateHookText = normalized.textCues?.find((cue) => cue.id === "this-hit-03470");

    expect(hookSection?.start).toBeCloseTo(76);
    expect(hookSection?.end).toBeCloseTo(76.5);
    expect(lateHookSection?.start).toBeCloseTo(227);
    expect(lateHookSection?.end).toBeCloseTo(228);
    expect(hookText?.start).toBeCloseTo(76);
    expect(lateHookText?.start).toBeCloseTo(227);
  });

  it("features the wireframe ride and mutation sections in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const wireframeRide = normalized.sections.find((section) => section.id === "switch-03320-wireframe");
    const mutation = normalized.sections.find((section) => section.id === "mega-drop-mutation");

    expect(wireframeRide?.effect).toBe("wireframeRide");
    expect(wireframeRide?.start).toBeCloseTo(212);
    expect(wireframeRide?.end).toBeCloseTo(215.2);

    expect(mutation?.effect).toBe("neon_alley");
    expect(mutation?.start).toBeCloseTo(280);
    expect(mutation?.end).toBeCloseTo(281.2);
    expect(mutation?.automation?.some((automation) => automation.param === "seed" && automation.from === 5)).toBe(
      true
    );
  });

  it("captures the machine-trance rush ramp in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const rampStart = normalized.sections.find((section) => section.id === "rush-03480");
    const rampMid = normalized.sections.find((section) => section.id === "rush-03564");
    const rampEnd = normalized.sections.find((section) => section.id === "rush-04104");

    expect(rampStart?.effect).toBe("glitch");
    expect(rampStart?.layers[0]?.effect).toBe("feedback");
    expect(rampStart?.layers[0]?.opacity).toBeCloseTo(0.12);

    expect(rampMid?.effect).toBe("fractal");
    expect(rampMid?.layers.map((layer) => layer.effect)).toEqual(["feedback", "particles"]);
    expect(rampMid?.layers[1]?.opacity).toBeCloseTo(0.16);

    expect(rampEnd?.effect).toBe("starfield");
    expect(rampEnd?.layers.map((layer) => layer.effect)).toEqual(["glitch", "particles"]);
    expect(rampEnd?.layers[1]?.opacity).toBeCloseTo(0.22);
  });

  it("accelerates chess playback in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const chessMoment = normalized.sections.find((section) => section.id === "chess-overlay-a");
    const chessRush = normalized.sections.find((section) => section.id === "rush-04027");
    const finale = normalized.sections.find((section) => section.id === "finale-layer");
    const finaleChessLayer = finale?.layers.find((layer) => layer.effect === "chess");

    expect(chessMoment?.params.speed).toBeGreaterThan(6);
    expect(chessRush?.params.speed).toBeGreaterThan(4);
    expect(finaleChessLayer?.params.speed).toBeGreaterThan(2);
  });

  it("uses rain and lightning as layered effects in the main timeline", () => {
    const timelinePath = new URL("../../public/timeline.json", import.meta.url);
    const raw = JSON.parse(readFileSync(timelinePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const baseEffects = new Set(normalized.sections.map((section) => section.effect));
    expect(baseEffects.has("rain")).toBe(false);
    expect(baseEffects.has("lightning")).toBe(false);

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
});
