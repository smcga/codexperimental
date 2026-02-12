import { describe, expect, it } from "vitest";
import { applyEraOverride, applyEraOverrideToTransition, TransitionState } from "./eraOverride";
import { SectionConfig } from "../config/loadConfig";

const baseSection: SectionConfig = {
  id: "section-1",
  start: 0,
  end: 10,
  effect: "starfield",
  era: "pcdemo",
  transition: {
    in: "fade",
    out: "fade",
    duration: 0.8
  },
  params: {},
  layers: [],
  endFromAudio: false,
  framing: "auto"
};

describe("era override helpers", () => {
  it("returns the same section when no override is provided", () => {
    const result = applyEraOverride(baseSection, null);
    expect(result).toBe(baseSection);
  });

  it("overrides the era when provided", () => {
    const result = applyEraOverride(baseSection, "16bit");
    expect(result).toEqual({ ...baseSection, era: "16bit" });
  });

  it("updates both transition endpoints when overriding", () => {
    const transition: TransitionState = {
      from: baseSection,
      to: { ...baseSection, id: "section-2", era: "future" },
      progress: 0.5,
      type: "wipe"
    };
    const result = applyEraOverrideToTransition(transition, "8bit");
    expect(result).toEqual({
      ...transition,
      from: { ...baseSection, era: "8bit" },
      to: { ...baseSection, id: "section-2", era: "8bit" }
    });
  });
});
