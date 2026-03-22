import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { MOIRE_GRID_DEFAULTS, MoireGridEffect } from "../moireGridEffect";

export const moire_gridManifest = defineEffectManifest({
  key: "moire_grid",
  className: "MoireGridEffect",
  sourcePath: "src/renderer/effects/moireGridEffect.ts",
  createEffect: () => new MoireGridEffect(),
  debug: {
    title: "Moire Grid Controls",
    controls: [
      numberControl("spacing", "Spacing", MOIRE_GRID_DEFAULTS.spacing, { min: 6, max: 80, step: 1 }),
      numberControl("lineWidth", "Line Width", MOIRE_GRID_DEFAULTS.lineWidth, { min: 0.5, max: 12, step: 0.1 }),
      numberControl("speed", "Speed", MOIRE_GRID_DEFAULTS.speed, { min: -6, max: 6, step: 0.05 }),
      numberControl("warp", "Warp", MOIRE_GRID_DEFAULTS.warp, { min: 0, max: 120, step: 1 }),
      numberControl("intensity", "Intensity", MOIRE_GRID_DEFAULTS.intensity, { min: 0.1, max: 1, step: 0.05 }),
      selectControl("palette", "Palette", MOIRE_GRID_DEFAULTS.palette, [
        { label: "Cyan", value: "cyan" },
        { label: "Magenta", value: "magenta" },
        { label: "Amber", value: "amber" }
      ]),
      numberControl("audioReact", "Audio React", MOIRE_GRID_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`spacing`, `lineWidth`, `speed`, `warp`, `intensity`, `palette`, `audioReact`",
    catalogNote: "Warped interference grid; `palette` supports `cyan`, `magenta`, or `amber`.",
    description: "Warped interference grid; `palette` supports `cyan`, `magenta`, or `amber`."
  }
});

export default moire_gridManifest;
