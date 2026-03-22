import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { BORDER_MULTIPLEX_DEFAULTS, BorderMultiplexEffect } from "../borderMultiplexEffect";

export const border_multiplexManifest = defineEffectManifest({
  key: "border_multiplex",
  className: "BorderMultiplexEffect",
  sourcePath: "src/renderer/effects/borderMultiplexEffect.ts",
  createEffect: () => new BorderMultiplexEffect(),
  debug: {
    title: "Border Multiplex Controls",
    controls: [
      numberControl("hwSprites", "HW Sprites", BORDER_MULTIPLEX_DEFAULTS.hwSprites, { min: 4, max: 16, step: 1 }),
      numberControl("totalSprites", "Total Sprites", BORDER_MULTIPLEX_DEFAULTS.totalSprites, { min: 16, max: 160, step: 1 }),
      numberControl("bandHeight", "Band Height", BORDER_MULTIPLEX_DEFAULTS.bandHeight, { min: 12, max: 64, step: 1 }),
      numberControl("spriteSize", "Sprite Size", BORDER_MULTIPLEX_DEFAULTS.spriteSize, { min: 6, max: 24, step: 1 }),
      numberControl("speed", "Speed", BORDER_MULTIPLEX_DEFAULTS.speed, { min: 20, max: 200, step: 1 }),
      numberControl("rasterJitter", "Raster Jitter", BORDER_MULTIPLEX_DEFAULTS.rasterJitter, { min: 0, max: 6, step: 0.1 }),
      numberControl("borderMaskStrength", "Border Mask", BORDER_MULTIPLEX_DEFAULTS.borderMaskStrength, { min: 0, max: 1, step: 0.05 }),
      numberControl("audioReact", "Audio React", BORDER_MULTIPLEX_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", BORDER_MULTIPLEX_DEFAULTS.seed, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`hwSprites`, `totalSprites`, `bandHeight`, `spriteSize`, `speed`, `rasterJitter`, `borderMaskStrength`, `audioReact`, `seed`",
    catalogNote: "",
    description: "Border Multiplex"
  }
});

export default border_multiplexManifest;
