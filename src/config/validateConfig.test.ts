import { describe, expect, it } from "vitest";

import { normalizeTimelineConfig } from "./loadConfig";
import { validateTimelineConfig } from "./validateConfig";

const buildRawConfig = (introEnd: number, firstSectionStart: number) => {
  return {
    audio: { src: "/song.mp3", offset: 0 },
    intro: {
      mode: "terminal" as const,
      end: introEnd,
      script: []
    },
    sections: [
      {
        id: "section-0",
        start: firstSectionStart,
        end: firstSectionStart + 4,
        effect: "starfield"
      }
    ],
    textCues: []
  };
};

describe("validateTimelineConfig", () => {
  it("accepts configs with matching intro end and first section start", () => {
    const config = normalizeTimelineConfig(buildRawConfig(54.15, 54.15));
    expect(() => validateTimelineConfig(config)).not.toThrow();
  });

  it("rejects configs with mismatched intro end and first section start", () => {
    const config = normalizeTimelineConfig(buildRawConfig(54.15, 54.1));
    expect(() => validateTimelineConfig(config)).toThrow(/first section must start/);
  });
});
