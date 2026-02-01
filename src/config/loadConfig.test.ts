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

  it("normalizes lighting2d overlay defaults", () => {
    const raw = createBaseConfig();
    raw.sections[0].overlays = {
      lighting2d: {
        enabled: true,
        lights: [],
        occluders: []
      }
    };

    const normalized = normalizeTimelineConfig(raw);
    const lighting = normalized.sections[0].overlays.lighting2d;
    expect(lighting).toBeTruthy();
    expect(lighting?.enabled).toBe(true);
    expect(lighting?.ambient).toBeCloseTo(0.6, 3);
    expect(lighting?.shadow.softness).toBeCloseTo(0.25, 3);
    expect(lighting?.shadow.length).toBeCloseTo(0.35, 3);
  });

  it("rejects invalid lighting2d follow values", () => {
    const raw = createBaseConfig();
    raw.sections[0].overlays = {
      lighting2d: {
        enabled: true,
        lights: [
          {
            kind: "point",
            x: 0.5,
            y: 0.5,
            radius: 0.4,
            intensity: 1.2,
            follow: "spin" as "none"
          }
        ]
      }
    };

    expect(() => normalizeTimelineConfig(raw)).toThrow(
      "sections[0].overlays.lighting2d.lights[0].follow must be \"none\", \"centre\", or \"beatJitter\""
    );
  });
});
