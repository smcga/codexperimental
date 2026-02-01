import { describe, expect, it } from "vitest";
import { shouldShowEffectPanel } from "./debugPanel";

describe("shouldShowEffectPanel", () => {
  it("shows the panel only when debug is enabled and an effect is selected", () => {
    expect(shouldShowEffectPanel(false, "flyover")).toBe(false);
    expect(shouldShowEffectPanel(true, null)).toBe(false);
    expect(shouldShowEffectPanel(true, "starfield")).toBe(true);
    expect(shouldShowEffectPanel(true, "flyover")).toBe(true);
  });
});
