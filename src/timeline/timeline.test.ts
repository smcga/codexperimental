import { describe, expect, it } from "vitest";
import { normalizeTimelineConfig } from "../config/loadConfig";
import { Timeline } from "./timeline";

const INTRO_END = 54.15;

function buildIntro() {
  return {
    mode: "terminal" as const,
    end: INTRO_END,
    script: []
  };
}

function buildSections(startOffset = INTRO_END): Array<{ id: string; start: number; effect: string; end?: number }> {
  const sections = [] as Array<{ id: string; start: number; effect: string; end?: number }>;
  for (let i = 0; i < 16; i += 1) {
    sections.push({
      id: `section-${i}`,
      start: startOffset + i * 4,
      effect: "starfield"
    });
  }
  return sections;
}

describe("timeline config normalization", () => {
  it("sorts sections and derives end times", () => {
    const sections = buildSections();
    sections[3].start = INTRO_END + 1;
    sections[1].start = INTRO_END + 22;
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      intro: buildIntro(),
      sections,
      textCues: []
    };

    const config = normalizeTimelineConfig(raw);
    expect(config.sections[0].start).toBe(INTRO_END);
    expect(config.sections[0].end).toBe(config.sections[1].start);
    const timeline = new Timeline(config);
    timeline.setAudioDuration(80);
    const last = config.sections[config.sections.length - 1];
    expect(last.end).toBe(80);
  });

  it("defaults cue end time when missing", () => {
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      intro: buildIntro(),
      sections: buildSections(),
      textCues: [
        {
          id: "line",
          start: 2.5,
          text: "Hello"
        }
      ]
    };
    const config = normalizeTimelineConfig(raw);
    expect(config.textCues[0].end).toBeCloseTo(5.5, 5);
  });

  it("parses time strings for sections and cues", () => {
    const formatTime = (totalSeconds: number): string => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const paddedSeconds = seconds.toFixed(1).padStart(4, "0");
      return `${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
    };
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      intro: buildIntro(),
      sections: buildSections().map((section, index) => ({
        ...section,
        start: formatTime(INTRO_END + index * 4)
      })),
      textCues: [
        {
          id: "line",
          start: "00:01.2",
          end: "00:04.8",
          text: "Hello"
        }
      ]
    };

    const config = normalizeTimelineConfig(raw);
    expect(config.sections[2].start).toBeCloseTo(62.1, 5);
    expect(config.textCues[0].start).toBeCloseTo(1.2, 5);
    expect(config.textCues[0].end).toBeCloseTo(4.8, 5);
  });

  it("switches to sections mode at the intro end time", () => {
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      intro: buildIntro(),
      sections: buildSections(),
      textCues: []
    };
    const config = normalizeTimelineConfig(raw);
    const timeline = new Timeline(config);
    expect(timeline.getState(INTRO_END - 0.01).mode).toBe("intro");
    expect(timeline.getState(INTRO_END).mode).toBe("sections");
  });
});
