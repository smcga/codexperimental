import { describe, expect, it } from "vitest";
import { getDebugEffectSelectorOptions, getDebugEffectSelectorValue, shouldShowEffectPanel } from "./debugPanel";

describe("shouldShowEffectPanel", () => {
  it("shows the panel only when debug is enabled and an effect is selected", () => {
    expect(shouldShowEffectPanel(false, "flyover")).toBe(false);
    expect(shouldShowEffectPanel(true, null)).toBe(false);
    expect(shouldShowEffectPanel(true, "starfield")).toBe(true);
    expect(shouldShowEffectPanel(true, "flyover")).toBe(true);
  });
});

describe("debug effect selector helpers", () => {
  it("maps null forced effect to timeline", () => {
    expect(getDebugEffectSelectorValue(null)).toBe("timeline");
    expect(getDebugEffectSelectorValue("roadDrive")).toBe("roadDrive");
  });

  it("prepends timeline to effect options", () => {
    expect(getDebugEffectSelectorOptions(["starfield", "roadDrive"])).toEqual(["timeline", "starfield", "roadDrive"]);
  });
});
