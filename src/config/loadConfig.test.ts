import { describe, expect, it } from "vitest";
import { normalizeTimelineConfig } from "./loadConfig";

const baseConfig = {
  audio: { src: "/song.mp3", offset: 0 },
  sections: Array.from({ length: 16 }, (_, index) => ({
    id: `section-${index}`,
    start: index * 4,
    effect: "plasma"
  })),
  textCues: [
    {
      id: "line-1",
      start: 1.5,
      text: "Hello world"
    }
  ]
};

describe("normalizeTimelineConfig", () => {
  it("sorts sections and derives end times", () => {
    const shuffled = {
      ...baseConfig,
      sections: [
        { id: "section-b", start: 6, effect: "plasma" },
        { id: "section-a", start: 2, effect: "plasma" },
        { id: "section-c", start: 10, end: 14, effect: "plasma" },
        ...Array.from({ length: 13 }, (_, index) => ({
          id: `section-${index + 3}`,
          start: 14 + index * 4,
          effect: "plasma"
        }))
      ]
    };

    const normalized = normalizeTimelineConfig(shuffled);
    expect(normalized.sections[0].id).toBe("section-a");
    expect(normalized.sections[0].end).toBe(6);
    expect(normalized.sections[1].id).toBe("section-b");
    expect(normalized.sections[1].end).toBe(10);
    expect(normalized.sections[2].end).toBe(14);
  });

  it("requires exactly 16 sections", () => {
    const tooFew = {
      ...baseConfig,
      sections: baseConfig.sections.slice(0, 4)
    };
    expect(() => normalizeTimelineConfig(tooFew)).toThrow(
      "Timeline must contain exactly 16 sections."
    );
  });

  it("defaults cue end time", () => {
    const normalized = normalizeTimelineConfig(baseConfig);
    expect(normalized.textCues[0].end).toBeCloseTo(4.5, 4);
  });
});
