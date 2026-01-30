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
