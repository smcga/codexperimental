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

    expect(normalized.intro.end).toBeCloseTo(54.2);
    expect(normalized.sections[0].start).toBeCloseTo(normalized.intro.end);
    expect(last.end).toBeCloseTo(382.87);
  });

  it("includes THIS hit sections and text cues in the release timeline", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const firstThisHit = normalized.sections.find((section) => section.id === "hook-hit-01662-flash");
    const majorDropHit = normalized.sections.find((section) => section.id === "drop-044073-flash");
    const firstThisText = normalized.textCues?.find((cue) => cue.id === "this-hit-techno");
    const majorDropText = normalized.textCues?.find((cue) => cue.id === "this-hit-megadrop");

    expect(firstThisHit?.start).toBeCloseTo(76.62);
    expect(firstThisHit?.end).toBeCloseTo(76.72);
    expect(majorDropHit?.start).toBeCloseTo(280.73);
    expect(majorDropHit?.end).toBeCloseTo(280.83);
    expect(firstThisText?.start).toBeCloseTo(76.62);
    expect(majorDropText?.start).toBeCloseTo(280.73);
  });

  it("keeps favorite showcase motifs: sunset growth, chess/physics, voxel/raytrace, and vga fire", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const sunset = normalized.sections.find((section) => section.id === "calm-sunset-a");
    expect(sunset?.effect).toBe("synthwaveSunset");
    expect(sunset?.automation?.some((automation) => automation.param === "sunSize")).toBe(true);

    const chessPhysics = normalized.sections.find((section) => section.id === "drop-body-b");
    expect(chessPhysics?.layers.map((layer) => layer.effect)).toContain("chess");
    expect(chessPhysics?.layers.map((layer) => layer.effect)).toContain("physics_pile");

    const voxelRaytrace = normalized.sections.find((section) => section.id === "mega-drop-plateau");
    expect(voxelRaytrace?.layers.map((layer) => layer.effect)).toContain("voxel_landscape");
    expect(voxelRaytrace?.layers.map((layer) => layer.effect)).toContain("raytrace_spheres");

    const withVgaFire = normalized.sections.filter((section) =>
      section.layers.some((layer) => layer.effect === "vga_fire")
    );
    expect(withVgaFire.length).toBeGreaterThanOrEqual(3);
  });

  it("captures both rush windows with feedback glue layers", () => {
    const releasePath = new URL("../../public/timeline.release.json", import.meta.url);
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const normalized = normalizeTimelineConfig(raw);

    const rushOne = normalized.sections.filter((section) => section.id.startsWith("era16bit-rush1-"));
    const rushTwo = normalized.sections.filter((section) => section.id.startsWith("drop-rush2-"));

    expect(rushOne).toHaveLength(16);
    expect(rushTwo).toHaveLength(16);
    expect(rushOne.every((section) => section.layers.some((layer) => layer.effect === "feedback"))).toBe(true);
    expect(rushTwo.every((section) => section.layers.some((layer) => layer.effect === "feedback"))).toBe(true);

    expect(rushOne[0]?.start).toBeCloseTo(106.27);
    expect(rushOne.at(-1)?.end).toBeCloseTo(108.56);
    expect(rushTwo[0]?.start).toBeCloseTo(171.1);
    expect(rushTwo.at(-1)?.end).toBeCloseTo(173.8);
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
