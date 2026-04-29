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

  it("reports active text cues only inside each cue interval", () => {
    const config = normalizeTimelineConfig({
      ...baseConfig,
      textCues: [
        { id: "cue-1", start: 55, end: 56, text: "A", x: 0.5, y: 0.5, align: "center", size: 32, color: "#fff" },
        { id: "cue-2", start: 57, end: 58, text: "B", x: 0.5, y: 0.6, align: "center", size: 28, color: "#0ff" }
      ]
    });
    const timeline = new Timeline(config);

    expect(timeline.getState(55.5).activeTextCues.map((cue) => cue.id)).toEqual(["cue-1"]);
    expect(timeline.getState(56.5).activeTextCues).toEqual([]);
    expect(timeline.getState(57.5).activeTextCues.map((cue) => cue.id)).toEqual(["cue-2"]);
  });

  it("uses the incoming transition type for the active boundary", () => {
    const config = normalizeTimelineConfig({
      ...baseConfig,
      sections: [
        {
          id: "a",
          start: 54.15,
          end: 60,
          effect: "starfield",
          transition: { in: "fade", out: "slide-left", duration: 1 }
        },
        {
          id: "b",
          start: 60,
          end: 66,
          effect: "tunnel",
          transition: { in: "flash", out: "wipe", duration: 1 }
        },
        {
          id: "c",
          start: 66,
          end: 72,
          effect: "plasma",
          transition: { out: "fade", duration: 1 }
        }
      ]
    });
    const timeline = new Timeline(config);

    expect(timeline.getState(60.25).transition?.type).toBe("flash");
    expect(timeline.getState(60.25).transition?.duration).toBe(1);
    expect(timeline.getState(66.25).transition?.type).toBe("fade");
    expect(timeline.getState(66.25).transition?.duration).toBe(1);
  });

  it("extends final section when its end comes from audio duration", () => {
    const config = normalizeTimelineConfig({
      ...baseConfig,
      sections: [
        { id: "a", start: 54.15, end: 60, effect: "starfield" },
        { id: "b", start: 60, effect: "tunnel" }
      ]
    });
    const timeline = new Timeline(config);

    expect(timeline.getDurationFallback()).toBe(0);
    timeline.setAudioDuration(123.4);
    expect(timeline.getDurationFallback()).toBe(123.4);
  });
});
