import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { SPACE_HANGAR_DEFAULTS, SpaceHangarEffect } from "../gl/spaceHangarEffect";

export const space_hangarManifest = defineEffectManifest({
  key: "space_hangar",
  className: "SpaceHangarEffect",
  sourcePath: "src/renderer/effects/gl/spaceHangarEffect.ts",
  createEffect: () => new SpaceHangarEffect(),
  debug: {
    title: "Space Hangar (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", SPACE_HANGAR_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("speed", "Speed", SPACE_HANGAR_DEFAULTS.speed, { min: 0.2, max: 2, step: 0.05 }),
      numberControl("exposure", "Exposure", SPACE_HANGAR_DEFAULTS.exposure, { min: 0.6, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", SPACE_HANGAR_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", SPACE_HANGAR_DEFAULTS.seed, { step: 1 })
    ]
  },
  docs: {
    parameters: "`quality`, `speed`, `exposure`, `hueShift`, `seed`",
    catalogNote: "Falls back to `tunnel` when WebGL2 is unavailable.",
    description: "Falls back to `tunnel` when WebGL2 is unavailable."
  }
});

export default space_hangarManifest;
