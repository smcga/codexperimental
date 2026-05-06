import { describe, expect, it } from "vitest";
import {
  addLayer,
  createLayer,
  createAutomationEntry,
  createTextCue,
  createScene,
  deleteScene,
  parseAdvancedParamsJSON,
  parseTimelineTimeValue,
  removeLayer,
  reorderLayers,
  reorderScenes,
  serializeTimeline
} from "./timelineStore";
import { RawTimelineConfig } from "../../config/loadConfig";

const baseTimeline: RawTimelineConfig = {
  audio: { src: "/song.mp3" },
  intro: {
    mode: "terminal",
    end: 10,
    theme: {
      bg: "#000",
      fg: "#fff",
      accent: "#fff",
      dim: "#333",
      fontFamily: "Courier New",
      fontSize: 20,
      lineHeight: 1.2,
      padding: 20,
      window: {
        title: "Test",
        chrome: true
      }
    },
    script: []
  },
  sections: [],
  textCues: []
};

describe("timelineStore", () => {
  it("createScene returns a schema-valid minimal scene", () => {
    const scene = createScene({ id: "scene-1", start: 0, end: 5, effect: "starfield" });
    expect(scene.id).toBe("scene-1");
    expect(scene.start).toBe(0);
    expect(scene.end).toBe(5);
    expect(scene.effect).toBe("starfield");
    expect(scene.fitAlign).toBe("fill");
  });

  it("createScene leaves end undefined when not provided", () => {
    const scene = createScene({ id: "scene-open", start: 12, effect: "plasma" });
    expect(scene.end).toBeUndefined();
  });

  it("createAutomationEntry applies overrides", () => {
    const entry = createAutomationEntry({ param: "glow", t0: 2.5, t1: 7.5, ease: undefined });
    expect(entry.param).toBe("glow");
    expect(entry.t0).toBe(2.5);
    expect(entry.t1).toBe(7.5);
    expect(entry.from).toBe(0);
    expect(entry.to).toBe(1);
    expect(entry.ease).toBeUndefined();
  });

  it("deleteScene removes by id and preserves remaining order", () => {
    const sections = [
      createScene({ id: "a", start: 0, end: 5, effect: "starfield" }),
      createScene({ id: "b", start: 5, end: 10, effect: "plasma" }),
      createScene({ id: "c", start: 10, end: 15, effect: "tunnel" })
    ];
    const next = deleteScene(sections, "b");
    expect(next.map((section) => section.id)).toEqual(["a", "c"]);
  });

  it("reorderScenes produces expected ordering", () => {
    const sections = [
      createScene({ id: "a", start: 0, end: 5, effect: "starfield" }),
      createScene({ id: "b", start: 5, end: 10, effect: "plasma" }),
      createScene({ id: "c", start: 10, end: 15, effect: "tunnel" })
    ];
    const next = reorderScenes(sections, 0, 2);
    expect(next.map((section) => section.id)).toEqual(["b", "c", "a"]);
  });

  it("addLayer/removeLayer/reorderLayers behave correctly", () => {
    const layers = [createLayer("starfield"), createLayer("plasma")];
    expect(layers[0].fitAlign).toBe("fill");
    const added = addLayer(layers, createLayer("tunnel"));
    expect(added).toHaveLength(3);
    const reordered = reorderLayers(added, 2, 0);
    expect(reordered[0].effect).toBe("tunnel");
    const trimmed = removeLayer(reordered, 1);
    expect(trimmed).toHaveLength(2);
  });

  it("parseAdvancedParamsJSON rejects invalid JSON and preserves previous value", () => {
    const previous = { speed: 1 };
    const invalid = parseAdvancedParamsJSON("{", previous);
    expect(invalid.nextParams).toEqual(previous);
    expect(invalid.error).toBe("Invalid JSON.");
  });

  it("parseAdvancedParamsJSON accepts string enum params", () => {
    const previous = { speed: 1 };
    const parsed = parseAdvancedParamsJSON('{"fractal":"mandelbox","audioReact":0.8}', previous);
    expect(parsed.error).toBeNull();
    expect(parsed.nextParams).toEqual({ fractal: "mandelbox", audioReact: 0.8 });
  });

  it("parseAdvancedParamsJSON rejects nested values", () => {
    const previous = { speed: 1 };
    const parsed = parseAdvancedParamsJSON('{"fractal":{"type":"mandelbox"}}', previous);
    expect(parsed.nextParams).toEqual(previous);
    expect(parsed.error).toBe("Param fractal must be a number, string, boolean, or null.");
  });

  it("parseTimelineTimeValue handles numbers and mm:ss strings", () => {
    expect(parseTimelineTimeValue(12.5)).toBe(12.5);
    expect(parseTimelineTimeValue("01:02.5")).toBeCloseTo(62.5);
    expect(parseTimelineTimeValue("03:00")).toBeCloseTo(180);
  });

  it("serializeTimeline produces JSON with no editor-only keys", () => {
    const serialized = serializeTimeline({
      ...baseTimeline,
      sections: [createScene({ id: "scene-1", start: 0, end: 5, effect: "starfield" })]
    });
    expect(serialized).not.toContain("__editor");
    expect(serialized).toContain("\"sections\"");
  });

  it("createTextCue includes independent mobile position and size defaults", () => {
    const cue = createTextCue({ start: 2, end: 5 });
    expect(cue.mobile).toEqual({ x: 0.5, y: 0.7, size: 42 });
  });
});
