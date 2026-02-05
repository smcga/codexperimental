import { describe, expect, it } from "vitest";
import {
  addLayer,
  createLayer,
  createScene,
  deleteScene,
  parseAdvancedParamsJSON,
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

  it("serializeTimeline produces JSON with no editor-only keys", () => {
    const serialized = serializeTimeline({
      ...baseTimeline,
      sections: [createScene({ id: "scene-1", start: 0, end: 5, effect: "starfield" })]
    });
    expect(serialized).not.toContain("__editor");
    expect(serialized).toContain("\"sections\"");
  });
});
