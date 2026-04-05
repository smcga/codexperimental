import { describe, expect, it } from "vitest";
import {
  applyLimitOverridesToControls,
  autoExpandDraftLimit,
  sanitizeEffectParamLimits
} from "./effectParamLimits";
import { EffectParamControl } from "../renderer/effects/manifest";

const controls: EffectParamControl[] = [
  { key: "speed", label: "Speed", type: "number", defaultValue: 1, min: 0, max: 2, step: 0.1 },
  { key: "palette", label: "Palette", type: "select", defaultValue: "day", options: [{ label: "Day", value: "day" }] },
  { key: "enabled", label: "Enabled", type: "toggle", defaultValue: 1 }
];

describe("sanitizeEffectParamLimits", () => {
  it("keeps only finite min/max overrides", () => {
    expect(
      sanitizeEffectParamLimits({
        starfield: {
          speed: { min: -2, max: 5 },
          warp: { min: "nope", max: 3 },
          drift: { min: null, max: undefined }
        },
        broken: "ignored"
      })
    ).toEqual({
      starfield: {
        speed: { min: -2, max: 5 },
        warp: { min: undefined, max: 3 }
      }
    });
  });
});

describe("applyLimitOverridesToControls", () => {
  it("only rewrites numeric control limits", () => {
    const updated = applyLimitOverridesToControls(controls, {
      speed: { min: -5, max: 9 },
      palette: { min: 0, max: 1 }
    });

    expect(updated[0]).toMatchObject({ key: "speed", min: -5, max: 9 });
    expect(updated[1]).toEqual(controls[1]);
    expect(updated[2]).toEqual(controls[2]);
  });
});

describe("autoExpandDraftLimit", () => {
  it("expands min/max when current value moves beyond the draft range", () => {
    expect(autoExpandDraftLimit({ min: 0, max: 10 }, -2)).toEqual({ min: -2, max: 10 });
    expect(autoExpandDraftLimit({ min: 0, max: 10 }, 12)).toEqual({ min: 0, max: 12 });
    expect(autoExpandDraftLimit({}, 4)).toEqual({ min: 4, max: 4 });
  });
});
