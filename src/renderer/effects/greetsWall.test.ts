import { describe, expect, it } from "vitest";

import {
  GREETS_WALL_DEFAULTS,
  normalizeGreetsWallParams,
  parseGreetsList,
  resolveGreetsSequenceIndex
} from "./greetsWall";

describe("GreetsWallEffect helpers", () => {
  it("parses names from arrays and delimited strings", () => {
    expect(parseGreetsList(["  Fairlight  ", "", "TRSI"])).toEqual(["Fairlight", "TRSI"]);
    expect(parseGreetsList("A| B, C\nD")).toEqual(["A", "B", "C", "D"]);
  });

  it("normalizes defaults and clamps parameters", () => {
    const params = normalizeGreetsWallParams({
      names: [],
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

    expect(params.names).toEqual(parseGreetsList(GREETS_WALL_DEFAULTS.names));
    expect(params.layout).toBe("grid");
    expect(params.transitionStyle).toBe("slide");
    expect(params.cycleSeconds).toBe(0.35);
    expect(params.columns).toBe(8);
    expect(params.padding).toBe(0.18);
    expect(params.highlightPulse).toBe(0);
    expect(params.beatPulseDecay).toBe(8);
    expect(params.audioReact).toBe(0);
    expect(params.title).toBe("GREETS");
  });

  it("advances sequence index over cycle duration", () => {
    expect(resolveGreetsSequenceIndex(0, 0.5, 4)).toBe(0);
    expect(resolveGreetsSequenceIndex(0.49, 0.5, 4)).toBe(0);
    expect(resolveGreetsSequenceIndex(0.5, 0.5, 4)).toBe(1);
    expect(resolveGreetsSequenceIndex(1.01, 0.5, 4)).toBe(2);
    expect(resolveGreetsSequenceIndex(2.2, 0.5, 4)).toBe(0);
  });
});
