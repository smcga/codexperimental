import { describe, expect, it } from "vitest";
import { getEraConstraints } from "./eraConstraints";

describe("getEraConstraints", () => {
  it("scales 8bit render size relative to base", () => {
    const defaults = getEraConstraints("8bit", 320, 180);
    expect(defaults.renderWidth).toBe(240);
    expect(defaults.renderHeight).toBe(135);

    const scaled = getEraConstraints("8bit", 640, 360);
    expect(scaled.renderWidth).toBe(480);
    expect(scaled.renderHeight).toBe(270);
  });
});
