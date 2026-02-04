import { describe, expect, it } from "vitest";
import { buildVgaFirePalette } from "./vgaFire";

describe("vga fire palette", () => {
  it("builds a 256-color fire ramp", () => {
    const palette = buildVgaFirePalette();
    expect(palette).toHaveLength(256 * 3);
    expect(Array.from(palette.slice(0, 3))).toEqual([0, 0, 0]);
    expect(Array.from(palette.slice(255 * 3, 255 * 3 + 3))).toEqual([255, 255, 255]);
  });

  it("keeps the ramp in warm hues", () => {
    const palette = buildVgaFirePalette();
    const mid = palette.slice(96 * 3, 96 * 3 + 3);
    const hot = palette.slice(160 * 3, 160 * 3 + 3);
    expect(mid[0]).toBeGreaterThan(0);
    expect(mid[2]).toBe(0);
    expect(hot[1]).toBeGreaterThan(60);
    expect(hot[2]).toBe(0);
  });
});
