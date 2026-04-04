import { describe, expect, it } from "vitest";

import { computeLetterbox } from "./letterbox";
import { SectionConfig } from "../config/loadConfig";
import { collectActiveEffectNames, resetNewlyActivatedEffects } from "./effectActivation";

describe("computeLetterbox", () => {
  it("uses cover scaling in portrait to fill the height", () => {
    const result = computeLetterbox(360, 640, 320, 180);

    expect(result.scale).toBeCloseTo(640 / 180, 4);
    expect(result.offsetY).toBeCloseTo(0, 4);
    expect(result.offsetX).toBeLessThan(0);
  });

  it("uses contain scaling in landscape to avoid cropping", () => {
    const result = computeLetterbox(800, 360, 320, 180);

    expect(result.scale).toBeCloseTo(2, 4);
    expect(result.offsetX).toBeCloseTo(80, 4);
    expect(result.offsetY).toBeCloseTo(0, 4);
  });
});

const makeSection = (overrides: Partial<SectionConfig> = {}): SectionConfig => ({
  id: "section-a",
  start: 0,
  end: 4,
  effect: "physics_pile",
  era: "pcdemo",
  params: {},
  automation: [],
  layers: [],
  transition: {
    in: "fade",
    out: "fade",
    duration: 0.8
  },
  endFromAudio: false,
  framing: "auto",
  fitAlign: "fill",
  ...overrides
});

describe("collectActiveEffectNames", () => {
  it("includes the base section effect and its layers", () => {
    const names = collectActiveEffectNames(
      makeSection({
        effect: "physics_pile",
        layers: [
          { effect: "starfield", opacity: 1, blend: "source-over", params: {}, automation: [], fitAlign: "fill" },
          { effect: "glitch", opacity: 0.5, blend: "screen", params: {}, automation: [], fitAlign: "fill" }
        ]
      })
    );

    expect([...names].sort()).toEqual(["glitch", "physics_pile", "starfield"]);
  });

  it("includes both sides of a transition", () => {
    const names = collectActiveEffectNames(makeSection({ effect: "physics_pile" }), {
      from: makeSection({ id: "section-from", effect: "starfield" }),
      to: makeSection({
        id: "section-to",
        effect: "physics_pile",
        layers: [{ effect: "glitch", opacity: 1, blend: "source-over", params: {}, automation: [], fitAlign: "fill" }]
      }),
      progress: 0.5,
      type: "fade"
    });

    expect([...names].sort()).toEqual(["glitch", "physics_pile", "starfield"]);
  });
});

describe("resetNewlyActivatedEffects", () => {
  it("resets only effects that have become active this frame", () => {
    const resetCalls: string[] = [];
    const registry = {
      physics_pile: { reset: () => resetCalls.push("physics_pile") },
      starfield: { reset: () => resetCalls.push("starfield") },
      glitch: { reset: () => resetCalls.push("glitch") }
    };

    resetNewlyActivatedEffects(new Set(["starfield"]), new Set(["starfield", "physics_pile", "glitch"]), registry);

    expect(resetCalls).toEqual(["physics_pile", "glitch"]);
  });
});
