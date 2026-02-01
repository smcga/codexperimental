import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeTimelineConfig, RawTimelineConfig } from "../config/loadConfig";
import { Timeline } from "./timeline";

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

describe("Timeline mode switching", () => {
  it("returns intro mode before the cutoff and sections mode at or after", () => {
    const config = normalizeTimelineConfig(baseConfig);
    const timeline = new Timeline(config);

    expect(timeline.getState(54.14).mode).toBe("intro");
    expect(timeline.getState(54.15).mode).toBe("sections");
    expect(timeline.getState(60).mode).toBe("sections");
  });
});

describe("Release timeline config", () => {
  it("keeps the release finale timed through 05:30", () => {
    const releasePath = path.resolve(process.cwd(), "public", "timeline.release.json");
    const raw = JSON.parse(readFileSync(releasePath, "utf-8")) as RawTimelineConfig;
    const config = normalizeTimelineConfig(raw);
    const lastSection = config.sections[config.sections.length - 1];

    expect(lastSection.end).toBeCloseTo(330, 4);
  });
});
