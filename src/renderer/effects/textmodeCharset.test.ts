import { describe, expect, it } from "vitest";
import {
  GLYPH_RAMPS,
  generateTextmodeGlyphGrid,
  pickGlyphFromIntensity,
  resolveTextmodeCharsetParams,
  TEXTMODE_CHARSET_DEFAULTS
} from "./textmodeCharset";

describe("pickGlyphFromIntensity", () => {
  it("maps low/mid/high intensities to the selected ramp", () => {
    const ramp = GLYPH_RAMPS[0];

    expect(pickGlyphFromIntensity(0, ramp)).toBe(" ");
    expect(pickGlyphFromIntensity(0.5, ramp)).toBe("+");
    expect(pickGlyphFromIntensity(1, ramp)).toBe("@");
  });
});

describe("resolveTextmodeCharsetParams", () => {
  it("clamps and normalizes incoming params", () => {
    const resolved = resolveTextmodeCharsetParams({
      cols: 2,
      rows: 999,
      glyphSet: -5,
      mode: -8,
      speed: 99,
      palette: -3,
      scanlines: -1,
      seed: -42
    });

    expect(resolved.cols).toBe(12);
    expect(resolved.rows).toBe(120);
    expect(resolved.glyphSet).toBe(5);
    expect(resolved.mode).toBe(8);
    expect(resolved.speed).toBe(6);
    expect(resolved.palette).toBe(3);
    expect(resolved.scanlines).toBe(0);
    expect(resolved.seed).toBe(42);
  });

  it("uses explicit defaults when params are missing", () => {
    expect(resolveTextmodeCharsetParams({})).toEqual(TEXTMODE_CHARSET_DEFAULTS);
  });
});

describe("generateTextmodeGlyphGrid", () => {
  it("is stable for fixed time + seed", () => {
    const params = resolveTextmodeCharsetParams({ cols: 10, rows: 5, glyphSet: 0, mode: 1, speed: 1.25, seed: 7 });
    const first = generateTextmodeGlyphGrid(10, 5, 3.4, params, 0.2, 0.3);
    const second = generateTextmodeGlyphGrid(10, 5, 3.4, params, 0.2, 0.3);

    expect(first).toEqual(second);
    expect(first.join("\n")).toMatchInlineSnapshot(`
      "=.+%%%%*:=
      ##:#@@#:**
      %:%:++:%.@
      %+.%@@#.#%
      -.*@@@%*.+"
    `);
  });
});
