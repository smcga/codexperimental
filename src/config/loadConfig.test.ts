import { describe, expect, it } from "vitest";

import { normalizeTimelineConfig, RawTimelineConfig } from "./loadConfig";

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

const baseConfig: RawTimelineConfig = {
  audio: { src: "/song.mp3", offset: 0 },
  intro: {
    mode: "terminal",
    end: 54.15,
    theme: baseTheme,
    script: []
  },
  sections: [
    {
      id: "start",
      start: 54.15,
      end: 60,
      effect: "starfield"
    }
  ],
  textCues: []
};

describe("normalizeTimelineConfig intro validation", () => {
  it("requires intro.end to be a valid number", () => {
    const config = {
      ...baseConfig,
      intro: { ...baseConfig.intro, end: "bad" }
    } satisfies RawTimelineConfig;
    expect(() => normalizeTimelineConfig(config)).toThrow("intro.end must be in mm:ss or mm:ss.s format");
  });

  it("requires the first section to start at intro.end", () => {
    const config = {
      ...baseConfig,
      sections: [{ ...baseConfig.sections[0], start: 54.2 }]
    } satisfies RawTimelineConfig;
    expect(() => normalizeTimelineConfig(config)).toThrow("Config error: first section must start at 54.15");
  });
});

describe("normalizeTimelineConfig transition validation", () => {
  it("accepts the extended transition set", () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          transition: {
            in: "slide-left",
            out: "flash",
            duration: 0.6
          }
        },
        {
          id: "follow-up",
          start: 60,
          end: 62,
          effect: "blobs",
          transition: {
            in: "iris",
            out: "slide-right",
            duration: 0.4
          }
        }
      ]
    } satisfies RawTimelineConfig;
    const normalized = normalizeTimelineConfig(config);
    expect(normalized.sections[0].transition.in).toBe("slide-left");
    expect(normalized.sections[0].transition.out).toBe("flash");
    expect(normalized.sections[1].transition.in).toBe("iris");
    expect(normalized.sections[1].transition.out).toBe("slide-right");
  });

  it("rejects unknown transition values", () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          transition: {
            in: "warp" as "fade",
            out: "wipe",
            duration: 0.6
          }
        }
      ]
    } satisfies RawTimelineConfig;
    expect(() => normalizeTimelineConfig(config)).toThrow(
      'transition.in must be one of "fade", "wipe", "slide-left", "slide-right", "slide-up", "slide-down", "iris", "flash"'
    );
  });
});

describe("normalizeTimelineConfig layer validation", () => {
  it("normalizes section layers with defaults", () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          layers: [
            {
              effect: "glitch",
              params: { intensity: 0.5 }
            }
          ]
        }
      ]
    } satisfies RawTimelineConfig;
    const normalized = normalizeTimelineConfig(config);
    expect(normalized.sections[0].layers[0].blend).toBe("screen");
    expect(normalized.sections[0].layers[0].opacity).toBe(0.6);
    expect(normalized.sections[0].layers[0].params.intensity).toBe(0.5);
  });

  it("rejects unsupported blend modes", () => {
    const config = {
      ...baseConfig,
      sections: [
        {
          ...baseConfig.sections[0],
          layers: [
            {
              effect: "glitch",
              blend: "unknown" as "screen"
            }
          ]
        }
      ]
    } satisfies RawTimelineConfig;
    expect(() => normalizeTimelineConfig(config)).toThrow(
      'sections[0].layers[0].blend must be one of "source-over", "screen", "overlay", "lighter", "multiply", "soft-light", "hard-light", "color-dodge", "difference", "exclusion", "xor"'
    );
  });
});

describe("normalizeTimelineConfig text cue validation", () => {
  it("normalizes text cues with spans, effects, and units", () => {
    const config = {
      ...baseConfig,
      textCues: [
        {
          id: "cue-1",
          start: "00:54.2",
          end: "00:58.0",
          spans: [
            { text: "A. I.", color: "#ffffff", size: 32 },
            { text: " CAN DO THIS!", color: "#ff0055", size: 40 }
          ],
          x: 120,
          y: 80,
          units: "px",
          effects: { typewriter: { speed: 18 }, shadow: true }
        }
      ]
    } satisfies RawTimelineConfig;

    const normalized = normalizeTimelineConfig(config);
    expect(normalized.textCues).toHaveLength(1);
    expect(normalized.textCues[0].spans[0].text).toBe("A. I.");
    expect(normalized.textCues[0].effects.typewriter?.speed).toBe(18);
    expect(normalized.textCues[0].units).toBe("px");
  });
});
