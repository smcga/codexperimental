import { describe, expect, it } from "vitest";

import { RawTimelineConfig, normalizeTimelineConfig } from "./loadConfig";

function createBaseConfig(): RawTimelineConfig {
  return {
    audio: { src: "/song.mp3", offset: 0 },
    intro: {
      mode: "terminal",
      end: 1,
      theme: {
        bg: "#000",
        fg: "#fff",
        accent: "#0f0",
        dim: "#666",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 14,
        padding: 10,
        window: {
          title: "demo",
          chrome: true
        }
      },
      script: [{ t: 0, type: "prompt", text: ">" }]
    },
    sections: [
      {
        id: "section-1",
        start: 1,
        end: 2,
        effect: "plasma"
      }
    ],
    textCues: []
  };
}

describe("normalizeTimelineConfig", () => {
  it("defaults section era to pcdemo", () => {
    const normalized = normalizeTimelineConfig(createBaseConfig());
    expect(normalized.sections[0].era).toBe("pcdemo");
  });

  it("accepts valid era presets", () => {
    const raw = createBaseConfig();
    raw.sections[0].era = "8bit";
    const normalized = normalizeTimelineConfig(raw);
    expect(normalized.sections[0].era).toBe("8bit");
  });

  it("rejects invalid era presets", () => {
    const raw = createBaseConfig();
    raw.sections[0].era = "future-nope" as "pcdemo";
    expect(() => normalizeTimelineConfig(raw)).toThrow("sections[0].era must be one of");
  });

  it("defaults blend illusions intensity and mode for future sections", () => {
    const raw = createBaseConfig();
    raw.sections[0].era = "future";
    raw.sections[0].overlays = { blendIllusions: {} };
    const normalized = normalizeTimelineConfig(raw);
    expect(normalized.sections[0].overlays.blendIllusions?.intensity).toBe(1);
    expect(normalized.sections[0].overlays.blendIllusions?.mode).toBe("all");
  });

  it("accepts explicit blend illusion mode and intensity", () => {
    const raw = createBaseConfig();
    raw.sections[0].overlays = { blendIllusions: { mode: "torch", intensity: 0.6 } };
    const normalized = normalizeTimelineConfig(raw);
    expect(normalized.sections[0].overlays.blendIllusions?.mode).toBe("torch");
    expect(normalized.sections[0].overlays.blendIllusions?.intensity).toBeCloseTo(0.6);
  });
});
