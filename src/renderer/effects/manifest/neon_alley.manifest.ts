import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { NEON_ALLEY_DEFAULTS, NeonAlleyEffect } from "../gl/neonAlleyEffect";

export const neon_alleyManifest = defineEffectManifest({
  key: "neon_alley",
  className: "NeonAlleyEffect",
  sourcePath: "src/renderer/effects/gl/neonAlleyEffect.ts",
  createEffect: () => new NeonAlleyEffect(),
  debug: {
    title: "Neon Alley (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", NEON_ALLEY_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("speed", "Speed", NEON_ALLEY_DEFAULTS.speed, { min: 0.2, max: 1.6, step: 0.05 }),
      numberControl("exposure", "Exposure", NEON_ALLEY_DEFAULTS.exposure, { min: 0.6, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", NEON_ALLEY_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", NEON_ALLEY_DEFAULTS.seed, { step: 1 })
    ]
  },
  docs: {
    parameters: "`quality`, `speed`, `exposure`, `hueShift`, `seed`",
    catalogNote: "Falls back to `neon` when WebGL2 is unavailable.",
    description: "Falls back to `neon` when WebGL2 is unavailable."
  }
});

export default neon_alleyManifest;
