import { INFINITE_ZOOM_DROSTE_DEFAULTS, InfiniteZoomDrosteEffect } from "../infiniteZoomDroste";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const infinite_zoom_drosteManifest = defineEffectManifest({
  key: "infinite_zoom_droste",
  className: "InfiniteZoomDrosteEffect",
  sourcePath: "src/renderer/effects/infiniteZoomDroste.ts",
  createEffect: () => new InfiniteZoomDrosteEffect(),
  debug: {
    title: "Infinite Zoom Droste Controls",
    controls: [
      numberControl("speed", "Speed", INFINITE_ZOOM_DROSTE_DEFAULTS.speed, { min: -1.8, max: 1.8, step: 0.01 }),
      numberControl("scaleBase", "Scale Base", INFINITE_ZOOM_DROSTE_DEFAULTS.scaleBase, { min: 1.2, max: 3.8, step: 0.01 }),
      numberControl("rotationSpeed", "Rotation Speed", INFINITE_ZOOM_DROSTE_DEFAULTS.rotationSpeed, { min: -1.2, max: 1.2, step: 0.01 }),
      numberControl("detail", "Detail", INFINITE_ZOOM_DROSTE_DEFAULTS.detail, { min: 0.1, max: 1, step: 0.01 }),
      numberControl("glow", "Glow", INFINITE_ZOOM_DROSTE_DEFAULTS.glow, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("pulse", "Pulse", INFINITE_ZOOM_DROSTE_DEFAULTS.pulse, { min: 0, max: 1, step: 0.01 }),
      numberControl("twist", "Twist", INFINITE_ZOOM_DROSTE_DEFAULTS.twist, { min: -1, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", INFINITE_ZOOM_DROSTE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 }),
      selectControl("shape", "Shape", INFINITE_ZOOM_DROSTE_DEFAULTS.shape, [
        { label: "Portal", value: "portal" },
        { label: "Rings", value: "rings" },
        { label: "Grid", value: "grid" }
      ]),
      selectControl("fitMode", "Fit Mode", INFINITE_ZOOM_DROSTE_DEFAULTS.fitMode, [
        { label: "Auto", value: "auto" },
        { label: "Safe", value: "safe" }
      ])
    ]
  },
  docs: {
    parameters: "`speed`, `scaleBase`, `rotationSpeed`, `detail`, `glow`, `pulse`, `twist`, `seed`, `shape`, `fitMode`",
    catalogNote: "`shape` supports `portal`, `rings`, or `grid`; `fitMode` supports `auto` or `safe`.",
    description: "Infinite nested portal recursion with continuous logarithmic zoom and layered geometric accents."
  }
});

export default infinite_zoom_drosteManifest;
