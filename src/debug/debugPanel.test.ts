import { describe, expect, it } from "vitest";
import {
  buildDebugRenderSelection,
  formatEffectSettingsForTimeline,
  getDebugEffectSelectorOptions,
  getDebugEffectSelectorValue,
  shouldShowEffectPanel
} from "./debugPanel";
import { getRegistryEffectNames } from "../renderer/effects/effectsDocGenerator";
import { SectionConfig, TextCue } from "../config/loadConfig";

const baseSection: SectionConfig = {
  id: "section-1",
  start: 10,
  end: 20,
  effect: "timelineEffect",
  era: "pcdemo",
  transition: {
    in: "fade",
    out: "fade",
    duration: 0.8
  },
  params: { speed: 0.5 },
  automation: [
    {
      param: "speed",
      from: 0.5,
      to: 1,
      t0: 10,
      t1: 20,
      ease: "linear"
    }
  ],
  layers: [
    {
      effect: "overlay",
      opacity: 0.75,
      blend: "screen",
      params: { glow: 1 },
      automation: [],
      fitAlign: "fill"
    }
  ],
  endFromAudio: false,
  framing: "auto",
  fitAlign: "fill"
};

const activeCue: TextCue = {
  id: "cue-1",
  start: 10,
  end: 12,
  spans: [],
  text: "Hello",
  x: 0.5,
  y: 0.5,
  align: "center",
  size: 42,
  color: "#fff",
  units: "normalized",
  effects: {
    glitchIn: false,
    shadow: false,
    scanlineMask: 0
  }
};

describe("shouldShowEffectPanel", () => {
  it("shows the panel only when debug is enabled and an effect is selected", () => {
    expect(shouldShowEffectPanel(false, "flyover")).toBe(false);
    expect(shouldShowEffectPanel(true, null)).toBe(false);
    expect(shouldShowEffectPanel(true, "starfield")).toBe(true);
    expect(shouldShowEffectPanel(true, "flyover")).toBe(true);
  });
});

describe("debug effect selector helpers", () => {
  it("maps null forced effect to timeline", () => {
    expect(getDebugEffectSelectorValue(null)).toBe("timeline");
    expect(getDebugEffectSelectorValue("roadDrive")).toBe("roadDrive");
  });

  it("prepends timeline to effect options", () => {
    expect(getDebugEffectSelectorOptions(["starfield", "roadDrive"])).toEqual(["timeline", "starfield", "roadDrive"]);
  });

  it("includes greets_wall from the effect manifest registry", () => {
    const options = getDebugEffectSelectorOptions(getRegistryEffectNames());
    expect(options).toContain("greets_wall");
  });

  it("includes water_reflection from the effect manifest registry", () => {
    const options = getDebugEffectSelectorOptions(getRegistryEffectNames());
    expect(options).toContain("water_reflection");
  });

  it("formats effect settings for timeline section JSON", () => {
    expect(formatEffectSettingsForTimeline("starfield", { speed: 0.8, density: 120 })).toBe(`{
  "effect": "starfield",
  "params": {
    "speed": 0.8,
    "density": 120
  }
}`);
  });
});

describe("buildDebugRenderSelection", () => {
  it("keeps the timeline transition and text cues when debug effect is timeline", () => {
    const transition = {
      from: { ...baseSection, id: "section-0", effect: "introEffect" },
      to: baseSection,
      progress: 0.4,
      type: "wipe" as const
    };

    const result = buildDebugRenderSelection({
      section: baseSection,
      transition,
      textCues: [activeCue],
      forcedEffect: null,
      transitionOverride: "flash"
    });

    expect(result).toEqual({
      section: baseSection,
      transition: {
        ...transition,
        type: "flash"
      },
      textCues: [activeCue],
      isolateEffect: false
    });
  });

  it("isolates a forced debug effect from timeline layers, automation, transitions, and text", () => {
    const transition = {
      from: { ...baseSection, id: "section-0", effect: "introEffect" },
      to: baseSection,
      progress: 0.4,
      type: "wipe" as const
    };

    const result = buildDebugRenderSelection({
      section: baseSection,
      transition,
      textCues: [activeCue],
      forcedEffect: "starfield",
      effectParams: { speed: 1.25, density: 120 },
      transitionOverride: "flash"
    });

    expect(result).toEqual({
      section: {
        ...baseSection,
        effect: "starfield",
        params: {
          speed: 1.25,
          density: 120
        },
        automation: [],
        layers: []
      },
      transition: undefined,
      textCues: [],
      isolateEffect: true
    });
  });
});
