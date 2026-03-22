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

  it("surfaces the configured incoming transition type while a section handoff is active", () => {
    const config = normalizeTimelineConfig({
      ...baseConfig,
      sections: [
        {
          id: "start",
          start: 54.15,
          end: 60,
          effect: "starfield",
          transition: {
            in: "fade",
            out: "fade",
            duration: 0.8
          }
        },
        {
          id: "peel",
          start: 60,
          end: 66,
          effect: "plasma",
          transition: {
            in: "reality-peel",
            out: "fade",
            duration: 1.2
          }
        }
      ]
    });
    const timeline = new Timeline(config);

    const state = timeline.getState(60.4);

    expect(state.transition).toMatchObject({
      type: "reality-peel",
      from: expect.objectContaining({ id: "start" }),
      to: expect.objectContaining({ id: "peel" })
    });
    expect(state.transition?.progress).toBeCloseTo(0.3333333333);
  });
});
