import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { IMPOSSIBLE_CORRIDOR_DEFAULTS, ImpossibleCorridorEffect } from "../gl/impossibleCorridorEffect";

export const gl_impossible_corridorManifest = defineEffectManifest({
  key: "gl_impossible_corridor",
  className: "ImpossibleCorridorEffect",
  sourcePath: "src/renderer/effects/gl/impossibleCorridorEffect.ts",
  createEffect: () => new ImpossibleCorridorEffect(),
  debug: {
    title: "Impossible Corridor Controls",
    controls: [
      numberControl("quality", "Quality", IMPOSSIBLE_CORRIDOR_DEFAULTS.quality, { min: 1, max: 3, step: 1 }),
      numberControl("warp", "Warp", IMPOSSIBLE_CORRIDOR_DEFAULTS.warp, { min: 0, max: 2, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", IMPOSSIBLE_CORRIDOR_DEFAULTS.hueShift, { min: 0, max: 1, step: 0.01 }),
      numberControl("exposure", "Exposure", IMPOSSIBLE_CORRIDOR_DEFAULTS.exposure, { min: 0.5, max: 2, step: 0.05 }),
      numberControl("seed", "Seed", IMPOSSIBLE_CORRIDOR_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      numberControl("speed", "Speed", IMPOSSIBLE_CORRIDOR_DEFAULTS.speed, { min: 0.1, max: 2, step: 0.05 }),
      numberControl("internalScale", "Internal Scale", 0.8, { min: 0.4, max: 1.2, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`quality`, `warp`, `hueShift`, `exposure`, `seed`, `speed`, `internalScale`",
    catalogNote: "Falls back to `tunnel` when WebGL2 is unavailable.",
    description: "Falls back to `tunnel` when WebGL2 is unavailable."
  }
});

export default gl_impossible_corridorManifest;
