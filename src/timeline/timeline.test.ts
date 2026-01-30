import { describe, expect, it } from "vitest";
import { normalizeTimelineConfig } from "../config/loadConfig";
import { Timeline } from "./timeline";

function buildSections(): Array<{ id: string; start: number; effect: string; end?: number }> {
  const sections = [] as Array<{ id: string; start: number; effect: string; end?: number }>;
  for (let i = 0; i < 16; i += 1) {
    sections.push({
      id: `section-${i}`,
      start: i * 4,
      effect: "starfield"
    });
  }
  return sections;
}

describe("timeline config normalization", () => {
  it("sorts sections and derives end times", () => {
    const sections = buildSections();
    sections[3].start = 1;
    sections[1].start = 22;
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      sections,
      textCues: []
    };

    const config = normalizeTimelineConfig(raw);
    expect(config.sections[0].start).toBe(0);
    expect(config.sections[0].end).toBe(config.sections[1].start);
    const timeline = new Timeline(config);
    timeline.setAudioDuration(80);
    const last = config.sections[config.sections.length - 1];
    expect(last.end).toBe(80);
  });

  it("requires exactly 16 sections", () => {
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      sections: buildSections().slice(0, 15)
    };
    expect(() => normalizeTimelineConfig(raw)).toThrow(/16/);
  });

  it("defaults cue end time when missing", () => {
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
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
    const raw = {
      audio: { src: "/song.mp3", offset: 0 },
      sections: buildSections().map((section, index) => ({
        ...section,
        start: `00:${String(index * 4).padStart(2, "0")}.0`
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
    expect(config.sections[2].start).toBeCloseTo(8, 5);
    expect(config.textCues[0].start).toBeCloseTo(1.2, 5);
    expect(config.textCues[0].end).toBeCloseTo(4.8, 5);
  });
});
