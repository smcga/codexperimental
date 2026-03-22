import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { TEXTMODE_CHARSET_DEFAULTS, TextmodeCharsetEffect } from "../textmodeCharset";

export const textmode_charsetManifest = defineEffectManifest({
  key: "textmode_charset",
  className: "TextmodeCharsetEffect",
  sourcePath: "src/renderer/effects/textmodeCharset.ts",
  createEffect: () => new TextmodeCharsetEffect(),
  debug: {
    title: "Textmode Charset Controls",
    controls: [
      numberControl("cols", "Columns", TEXTMODE_CHARSET_DEFAULTS.cols, { min: 12, max: 180, step: 1 }),
      numberControl("rows", "Rows", TEXTMODE_CHARSET_DEFAULTS.rows, { min: 8, max: 120, step: 1 }),
      numberControl("glyphSet", "Glyph Set", TEXTMODE_CHARSET_DEFAULTS.glyphSet, { min: 0, max: 8, step: 1 }),
      numberControl("mode", "Mode", TEXTMODE_CHARSET_DEFAULTS.mode, { min: 0, max: 8, step: 1 }),
      numberControl("speed", "Speed", TEXTMODE_CHARSET_DEFAULTS.speed, { min: 0, max: 6, step: 0.05 }),
      numberControl("palette", "Palette", TEXTMODE_CHARSET_DEFAULTS.palette, { min: 0, max: 8, step: 1 }),
      numberControl("scanlines", "Scanlines", TEXTMODE_CHARSET_DEFAULTS.scanlines, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", TEXTMODE_CHARSET_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`cols`, `rows`, `glyphSet`, `mode`, `speed`, `palette`, `scanlines`, `seed`",
    catalogNote: "Coarse character-grid renderer with glyph ramps (` .:-=+*#%@`) and palette-indexed tinting.",
    description: "Coarse character-grid renderer with glyph ramps (` .:-=+*#%@`) and palette-indexed tinting."
  }
});

export default textmode_charsetManifest;
