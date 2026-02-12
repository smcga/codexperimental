import { describe, expect, it } from "vitest";

import { resolveTextPosition } from "./textRenderer";

describe("resolveTextPosition", () => {
  it("clamps to safe rect bounds", () => {
    const result = resolveTextPosition("center", -20, 300, { x: 12, y: 18, w: 280, h: 140 }, 320, 180);

    expect(result.px).toBe(12);
    expect(result.py).toBe(158);
  });

  it("returns unchanged coordinates within safe bounds", () => {
    const result = resolveTextPosition("left", 40, 60, { x: 12, y: 18, w: 280, h: 140 }, 320, 180);

    expect(result.px).toBe(40);
    expect(result.py).toBe(60);
  });
});
