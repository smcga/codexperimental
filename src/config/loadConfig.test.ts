import { describe, expect, it } from "vitest";
import { normalizeTimelineConfig, TimelineConfig } from "./loadConfig";

function buildSections(count = 16): TimelineConfig["sections"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `section-${index}`,
    start: index * 4,
    effect: "plasma"
  }));
}

describe("normalizeTimelineConfig", () => {
  it("sorts sections and derives end times", () => {
    const sections = buildSections();
    const unsorted = [sections[2], sections[0], sections[1], ...sections.slice(3)];
    const raw: TimelineConfig = {
      audio: { src: "/song.mp3" },
      sections: unsorted,
      textCues: []
    };

    const normalized = normalizeTimelineConfig(raw, 70);
    expect(normalized.sections[0].id).toBe("section-0");
    expect(normalized.sections[0].end).toBe(4);
    expect(normalized.sections[1].end).toBe(8);
    expect(normalized.sections[normalized.sections.length - 1].end).toBe(70);
  });

  it("requires exactly 16 sections", () => {
    const raw: TimelineConfig = {
      audio: { src: "/song.mp3" },
      sections: buildSections(15),
      textCues: []
    };
    expect(() => normalizeTimelineConfig(raw, 60)).toThrow(/16 sections/);
  });

  it("defaults cue end time to start + 3", () => {
    const raw: TimelineConfig = {
      audio: { src: "/song.mp3" },
      sections: buildSections(),
      textCues: [
        {
          id: "cue-1",
          start: 2,
          text: "Hello"
        }
      ]
    };
    const normalized = normalizeTimelineConfig(raw, 64);
    expect(normalized.textCues[0].end).toBeCloseTo(5, 5);
  });
});
