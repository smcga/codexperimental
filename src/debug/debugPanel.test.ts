import { describe, expect, it } from "vitest";
import { shouldShowFlyoverPanel } from "./debugPanel";

describe("shouldShowFlyoverPanel", () => {
  it("shows the panel only when debug is enabled and flyover is selected", () => {
    expect(shouldShowFlyoverPanel(false, "flyover")).toBe(false);
    expect(shouldShowFlyoverPanel(true, null)).toBe(false);
    expect(shouldShowFlyoverPanel(true, "timeline")).toBe(false);
    expect(shouldShowFlyoverPanel(true, "flyover")).toBe(true);
  });
});
