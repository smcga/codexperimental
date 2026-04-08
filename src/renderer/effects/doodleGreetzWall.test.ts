import { describe, expect, it } from "vitest";

import {
  DOODLE_GREETZ_WALL_DEFAULTS,
  normalizeDoodleGreetzWallParams,
  orderDoodlesForWall,
  resolveDoodleWallSequenceIndex
} from "./doodleGreetzWall";

describe("DoodleGreetzWallEffect helpers", () => {
  it("normalizes defaults and clamps parameters", () => {
    const params = normalizeDoodleGreetzWallParams({
      layout: "invalid",
      transitionStyle: "whoops",
      cycleSeconds: 0.01,
      columns: 99,
      padding: 2,
      highlightPulse: -1,
      beatPulseDecay: 99,
      audioReact: -4,
      title: ""
    });

    expect(params.layout).toBe(DOODLE_GREETZ_WALL_DEFAULTS.layout);
    expect(params.transitionStyle).toBe(DOODLE_GREETZ_WALL_DEFAULTS.transitionStyle);
    expect(params.cycleSeconds).toBe(0.35);
    expect(params.columns).toBe(8);
    expect(params.padding).toBe(0.18);
    expect(params.highlightPulse).toBe(0);
    expect(params.beatPulseDecay).toBe(8);
    expect(params.audioReact).toBe(0);
    expect(params.title).toBe(DOODLE_GREETZ_WALL_DEFAULTS.title);
  });

  it("orders doodles deterministically for the wall", () => {
    const doodles = orderDoodlesForWall([
      { id: "gamma", imageData: "data:image/png;base64,g", createdAt: 3 },
      { id: "alpha", imageData: "data:image/png;base64,a", createdAt: 1 },
      { id: "beta", imageData: "data:image/png;base64,b", createdAt: 2 }
    ]);

    expect(doodles.map((doodle) => doodle.id)).toEqual(orderDoodlesForWall(doodles).map((doodle) => doodle.id));
    expect(new Set(doodles.map((doodle) => doodle.id))).toEqual(new Set(["alpha", "beta", "gamma"]));
  });

  it("advances sequence index over cycle duration", () => {
    expect(resolveDoodleWallSequenceIndex(0, 0.5, 4)).toBe(0);
    expect(resolveDoodleWallSequenceIndex(0.49, 0.5, 4)).toBe(0);
    expect(resolveDoodleWallSequenceIndex(0.5, 0.5, 4)).toBe(1);
    expect(resolveDoodleWallSequenceIndex(1.01, 0.5, 4)).toBe(2);
    expect(resolveDoodleWallSequenceIndex(2.2, 0.5, 4)).toBe(0);
  });
});
