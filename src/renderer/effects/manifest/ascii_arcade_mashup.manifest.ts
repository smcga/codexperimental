import { AsciiArcadeMashupEffect, ASCII_ARCADE_MASHUP_DEFAULTS } from "../asciiArcadeMashup";
import { defineEffectManifest, numberControl } from "./shared";

export const ascii_arcade_mashupManifest = defineEffectManifest({
  key: "ascii_arcade_mashup",
  className: "AsciiArcadeMashupEffect",
  sourcePath: "src/renderer/effects/asciiArcadeMashup.ts",
  createEffect: () => new AsciiArcadeMashupEffect(),
  debug: {
    title: "ASCII Arcade Mashup",
    controls: [
      numberControl("speed", "Speed", ASCII_ARCADE_MASHUP_DEFAULTS.speed, { min: 0.2, max: 3, step: 0.05 }),
      numberControl("blend", "Blend Bias", ASCII_ARCADE_MASHUP_DEFAULTS.blend, { min: 0, max: 1, step: 0.01 }),
      numberControl("density", "Density", ASCII_ARCADE_MASHUP_DEFAULTS.density, { min: 0.5, max: 1.8, step: 0.05 }),
      numberControl("glow", "Glow", ASCII_ARCADE_MASHUP_DEFAULTS.glow, { min: 0, max: 1, step: 0.01 }),
      numberControl("scanlines", "Scanlines", ASCII_ARCADE_MASHUP_DEFAULTS.scanlines, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", ASCII_ARCADE_MASHUP_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    description: "ASCII mini-scenes inspired by arcade classics (Pong, maze chase, asteroid field, invader wave) that dither-blend into each other.",
    parameters: "`speed`, `blend`, `density`, `glow`, `scanlines`, `seed`",
    catalogNote: "Pure ASCII arcade tribute with deterministic per-glyph crossfades between game vignettes."
  }
});

export default ascii_arcade_mashupManifest;
