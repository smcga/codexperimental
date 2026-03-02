import { describe, expect, it } from "vitest";
import {
  formatEffectSettingsForTimeline,
  getDebugEffectSelectorOptions,
  getDebugEffectSelectorValue,
  shouldShowEffectPanel
} from "./debugPanel";
import fs from "node:fs";
import path from "node:path";

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

  it("includes greets_wall from the effect registry source", () => {
    const registryPath = path.resolve(process.cwd(), "src/renderer/effects/index.ts");
    const registrySource = fs.readFileSync(registryPath, "utf-8");
    const keys = [...registrySource.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)].map((match) => match[1]);
    const options = getDebugEffectSelectorOptions(keys);
    expect(options).toContain("greets_wall");
  });

  it("formats effect settings for timeline section JSON", () => {
    expect(formatEffectSettingsForTimeline("starfield", { speed: 0.8, density: 120 })).toBe(`{
  "effect": "starfield",
  "params": {
    "speed": 0.8,
    "density": 120
  }
}`);
  });
});
