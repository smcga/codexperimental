import { describe, expect, it } from "vitest";
import {
  computeSceneSeekTime,
  getNewSceneTimeRange,
  getNextNewSectionName,
  getRandomEffectParams,
  getRandomEffectSelection,
  getScenePlayingAtTime,
  isWithinSceneStartThreshold,
  isEditorParamToggleChecked,
  parseEditorParamInputValue,
  splitCueWords,
  generateWordTextCues
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

describe("getRandomEffectSelection", () => {
  it("returns a random effect from the available list", () => {
    expect(getRandomEffectSelection(["starfield", "plasma", "glitch"], () => 0.5)).toBe("plasma");
  });

  it("falls back to starfield when no effects are available", () => {
    expect(getRandomEffectSelection([], () => 0.8)).toBe("starfield");
  });
});

describe("getRandomEffectParams", () => {
  it("generates random values for all effect controls", () => {
    const nextValue = [0.2, 0.6, 0.1, 0.8, 0.05, 0.95, 0.4, 0.75];
    let index = 0;
    const randomValue = () => {
      const value = nextValue[index] ?? 0.5;
      index += 1;
      return value;
    };

    const params = getRandomEffectParams("starfield", randomValue);
    expect(Object.keys(params)).toEqual([
      "speed",
      "warp",
      "turnRate",
      "turnStrength",
      "drift",
      "sparkle",
      "colorShift"
    ]);
    expect(params).toEqual({
      speed: 0.4,
      warp: 0.6,
      turnRate: 0.15,
      turnStrength: 0.8,
      drift: 0.05,
      sparkle: 1.9,
      colorShift: -0.2
    });
  });

  it("supports toggle and select controls", () => {
    const params = getRandomEffectParams("metaballs", () => 0.9);

    expect(params.palette).toBe("neon");
    expect(params.smoothing).toBe(1);
    expect(params.seed).toBe(899);
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


describe("splitCueWords", () => {
  it("splits on whitespace and ignores empty tokens", () => {
    expect(splitCueWords("  one\n two   three\t")).toEqual(["one", "two", "three"]);
  });
});

describe("generateWordTextCues", () => {
  it("creates one cue per word spread across the timing window", () => {
    const cues = generateWordTextCues({
      text: "alpha beta gamma",
      start: 10,
      end: 13,
      font: "Inter",
      color: "#ff00aa",
      size: 56,
      x: 0.2,
      y: 0.4,
      align: "left",
      existingIds: new Set()
    });

    expect(cues).toHaveLength(3);
    expect(cues.map((cue) => cue.text)).toEqual(["alpha", "beta", "gamma"]);
    expect(cues.map((cue) => cue.start)).toEqual([10, 11, 12]);
    expect(cues.map((cue) => cue.end)).toEqual([11, 12, 13]);
    expect(cues[0]).toMatchObject({
      color: "#ff00aa",
      size: 56,
      x: 0.2,
      y: 0.4,
      align: "left",
      units: "normalized"
    });
    expect(cues[0].spans?.[0]).toMatchObject({
      font: "Inter",
      color: "#ff00aa",
      size: 56,
      text: "alpha"
    });
  });

  it("ensures generated ids are unique against existing cues", () => {
    const cues = generateWordTextCues({
      text: "one two",
      start: 0,
      end: 1,
      font: "inherit",
      color: "#fff",
      size: 42,
      x: 0.5,
      y: 0.7,
      align: "center",
      idPrefix: "scene",
      existingIds: new Set(["scene-1", "scene-2"])
    });

    expect(cues.map((cue) => cue.id)).toEqual(["scene-1-2", "scene-2-2"]);
  });
});
