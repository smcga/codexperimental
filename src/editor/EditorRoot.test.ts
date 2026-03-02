import { describe, expect, it } from "vitest";
import { computeSceneSeekTime, getScenePlayingAtTime } from "./EditorRoot";

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
