import { describe, expect, it } from "vitest";
import { parseTimelineConfig } from "./loadConfig";

const buildSections = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `section-${index}`,
    start: index * 5,
    effect: "starfield",
    transition: { in: "fade", out: "fade", duration: 0.5 }
  }));

describe("parseTimelineConfig", () => {
  it("sorts sections and derives end times", () => {
    const sections = buildSections(16);
    const input = {
      audio: { src: "/song.mp3", offset: 0 },
      sections: [sections[2], sections[0], sections[1], ...sections.slice(3)],
      textCues: [
        {
          id: "cue",
          start: 2,
          text: "hello"
        }
      ]
    };

    const parsed = parseTimelineConfig(input);
    expect(parsed.sections[0].id).toBe("section-0");
    expect(parsed.sections[0].end).toBe(parsed.sections[1].start);
    expect(parsed.sections[1].end).toBe(parsed.sections[2].start);
  });

  it("defaults cue end time", () => {
    const input = {
      audio: { src: "/song.mp3", offset: 0 },
      sections: buildSections(16),
      textCues: [
        {
          id: "cue",
          start: 5,
          text: "hello"
        }
      ]
    };

    const parsed = parseTimelineConfig(input);
    expect(parsed.textCues[0].end).toBeCloseTo(8);
  });

  it("requires exactly 16 sections", () => {
    const input = {
      audio: { src: "/song.mp3", offset: 0 },
      sections: buildSections(2),
      textCues: []
    };

    expect(() => parseTimelineConfig(input)).toThrow(/16 sections/);
  });
});
