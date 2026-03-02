import { describe, expect, it } from "vitest";
import {
  computeSceneSeekTime,
  getNewSceneTimeRange,
  getNextNewSectionName,
  getScenePlayingAtTime,
  isWithinSceneStartThreshold,
  isEditorParamToggleChecked,
  parseEditorParamInputValue
} from "./EditorRoot";

describe("computeSceneSeekTime", () => {
  it("subtracts audio offset from the scene start", () => {
    expect(computeSceneSeekTime(18.5, 2)).toBe(16.5);
  });

  it("clamps to zero when offset exceeds scene start", () => {
    expect(computeSceneSeekTime(1, 4)).toBe(0);
  });

  it("accepts scene start values provided as timeline strings", () => {
    expect(computeSceneSeekTime("00:12.5", 2.5)).toBe(10);
  });
});

describe("getScenePlayingAtTime", () => {
  const scenes = [
    { id: "intro", start: 0, end: 10, effect: "starfield" },
    { id: "middle", start: 10, effect: "starfield" },
    { id: "ending", start: 20, end: 24, effect: "starfield" }
  ];

  it("returns the scene containing the demo time", () => {
    expect(getScenePlayingAtTime(scenes, 5)?.id).toBe("intro");
    expect(getScenePlayingAtTime(scenes, 10)?.id).toBe("middle");
  });

  it("falls back to the next scene start when end is omitted", () => {
    expect(getScenePlayingAtTime(scenes, 19.5)?.id).toBe("middle");
  });

  it("returns null when no scene matches", () => {
    expect(getScenePlayingAtTime(scenes, 30)).toBeNull();
    expect(getScenePlayingAtTime(scenes, Number.NaN)).toBeNull();
  });
});

describe("getNewSceneTimeRange", () => {
  const scenes = [
    { id: "intro", start: 0, end: 10, effect: "starfield" },
    { id: "middle", start: 10, end: 20, effect: "starfield" },
    { id: "ending", start: 24, end: 28, effect: "starfield" }
  ];

  it("starts the new scene at the current playback position", () => {
    expect(getNewSceneTimeRange(scenes, 12.5)).toEqual({ start: 12.5, end: 24 });
  });

  it("uses the next scene start as the new scene end", () => {
    expect(getNewSceneTimeRange(scenes, 0)).toEqual({ start: 0, end: 10 });
  });

  it("falls back to a 10 second duration when there is no following scene", () => {
    expect(getNewSceneTimeRange(scenes, 30)).toEqual({ start: 30, end: 40 });
  });

  it("clamps negative playback time to zero", () => {
    expect(getNewSceneTimeRange(scenes, -3)).toEqual({ start: 0, end: 10 });
  });
});

describe("getNextNewSectionName", () => {
  it("uses New Section 1 when there are no matching section ids", () => {
    expect(getNextNewSectionName([])).toBe("New Section 1");
    expect(getNextNewSectionName([{ id: "intro", start: 0, effect: "starfield" }])).toBe("New Section 1");
  });

  it("increments from the highest New Section suffix", () => {
    const scenes = [
      { id: "New Section 2", start: 0, effect: "starfield" },
      { id: "New Section 9", start: 10, effect: "starfield" },
      { id: "New Section 4", start: 20, effect: "starfield" }
    ];
    expect(getNextNewSectionName(scenes)).toBe("New Section 10");
  });
});

describe("isWithinSceneStartThreshold", () => {
  const scenes = [
    { id: "a", start: 2, effect: "starfield" },
    { id: "b", start: 5.5, effect: "starfield" }
  ];

  it("returns true when playback time is within the threshold of a start", () => {
    expect(isWithinSceneStartThreshold(scenes, 2.08)).toBe(true);
  });

  it("returns false when playback time is outside the threshold", () => {
    expect(isWithinSceneStartThreshold(scenes, 2.11)).toBe(false);
  });
});

describe("parseEditorParamInputValue", () => {
  it("parses booleans and null", () => {
    expect(parseEditorParamInputValue("true")).toBe(true);
    expect(parseEditorParamInputValue("false")).toBe(false);
    expect(parseEditorParamInputValue("null")).toBeNull();
  });

  it("parses numbers and strings", () => {
    expect(parseEditorParamInputValue("1.25")).toBe(1.25);
    expect(parseEditorParamInputValue("\"chrome\"")).toBe("chrome");
    expect(parseEditorParamInputValue("rawValue")).toBe("rawValue");
  });
});

describe("isEditorParamToggleChecked", () => {
  it("accepts both legacy numeric and boolean values", () => {
    expect(isEditorParamToggleChecked(true)).toBe(true);
    expect(isEditorParamToggleChecked(1)).toBe(true);
    expect(isEditorParamToggleChecked(false)).toBe(false);
    expect(isEditorParamToggleChecked(0)).toBe(false);
  });
});
