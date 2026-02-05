import { describe, expect, it } from "vitest";

import { RawTimelineConfig, normalizeTimelineConfig } from "../../config/loadConfig";
import {
  addLayer,
  createScene,
  deleteScene,
  parseAdvancedParamsJSON,
  reorderLayers,
  reorderScenes,
  removeLayer,
  serializeTimeline
} from "./timelineStore";

const baseTheme = {
  bg: "#000000",
  fg: "#ffffff",
  accent: "#00ff00",
  dim: "#666666",
  fontFamily: "monospace",
  fontSize: 16,
  lineHeight: 20,
  padding: 24,
  window: {
    title: "demo@machine:~",
    chrome: true
  }
};

function buildTimeline(sections: RawTimelineConfig["sections"]): RawTimelineConfig {
  return {
    audio: { src: "/song.mp3", offset: 0 },
    intro: {
      mode: "terminal",
      end: 10,
      theme: baseTheme,
      script: []
    },
    sections,
    textCues: []
  };
}

describe("editor timeline store", () => {
  it("createScene returns a schema-valid minimal scene", () => {
    const scene = createScene(10, 20, new Set());
    const timeline = buildTimeline([scene]);
    expect(() => normalizeTimelineConfig(timeline)).not.toThrow();
  });

  it("deleteScene removes by id and preserves remaining order", () => {
    const sections = [
      createScene(10, 20, new Set()),
      { ...createScene(20, 30, new Set(["scene"])), id: "scene-1" },
      { ...createScene(30, 40, new Set(["scene", "scene-1"])), id: "scene-2" }
    ];
    const result = deleteScene(sections, "scene-1");
    expect(result.map((section) => section.id)).toEqual(["scene", "scene-2"]);
  });

  it("reorderScenes produces expected ordering", () => {
    const sections = [
      { ...createScene(10, 20, new Set()), id: "a" },
      { ...createScene(20, 30, new Set(["a"])), id: "b" },
      { ...createScene(30, 40, new Set(["a", "b"])), id: "c" }
    ];
    const result = reorderScenes(sections, 0, 2);
    expect(result.map((section) => section.id)).toEqual(["b", "c", "a"]);
  });

  it("addLayer/removeLayer/reorderLayers behave correctly", () => {
    const scene = createScene(10, 20, new Set());
    const withLayer = addLayer(scene);
    expect(withLayer.layers?.length).toBe(1);
    const withSecond = addLayer(withLayer);
    expect(withSecond.layers?.length).toBe(2);
    const reordered = reorderLayers(withSecond, 0, 1);
    expect(reordered.layers?.length).toBe(2);
    const removed = removeLayer(reordered, 0);
    expect(removed.layers?.length).toBe(1);
  });

  it("parseAdvancedParamsJSON rejects invalid JSON and preserves previous value", () => {
    const previous = { speed: 1 };
    const result = parseAdvancedParamsJSON("not-json", previous);
    expect(result.next).toEqual(previous);
    expect(result.error).toBeTruthy();
  });

  it("serializeTimeline produces JSON with no editor-only keys", () => {
    const timeline = buildTimeline([createScene(10, 20, new Set())]);
    const serialized = serializeTimeline(timeline);
    expect(Object.keys(serialized)).toEqual(Object.keys(timeline));
  });
});
