import { defineEffectManifest, numberControl } from "./shared";
import { FRACTAL_ZOOMER_DEFAULTS, FractalZoomerEffect } from "../fractalZoomer";

export const fractal_zoomerManifest = defineEffectManifest({
  key: "fractal_zoomer",
  className: "FractalZoomerEffect",
  sourcePath: "src/renderer/effects/fractalZoomer.ts",
  createEffect: () => new FractalZoomerEffect(),
  debug: {
    title: "Fractal Zoomer Controls",
    controls: [
      numberControl("zoom", "Zoom", FRACTAL_ZOOMER_DEFAULTS.zoom, { min: 0.4, max: 8, step: 0.05 }),
      numberControl("centerX", "Center X", FRACTAL_ZOOMER_DEFAULTS.centerX, { min: -2.5, max: 1.5, step: 0.01 }),
      numberControl("centerY", "Center Y", FRACTAL_ZOOMER_DEFAULTS.centerY, { min: -1.8, max: 1.8, step: 0.01 }),
      numberControl("iterations", "Iterations", FRACTAL_ZOOMER_DEFAULTS.iterations, { min: 24, max: 1600, step: 1 }),
      numberControl("paletteSpeed", "Palette Speed", FRACTAL_ZOOMER_DEFAULTS.paletteSpeed, { min: 0, max: 2, step: 0.01 }),
      numberControl("audioReact", "Audio React", FRACTAL_ZOOMER_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`zoom`, `centerX`, `centerY`, `iterations`, `paletteSpeed`, `audioReact`",
    catalogNote: "High-resolution Mandelbrot edge dive with continuous auto-zoom.",
    description: "High-resolution Mandelbrot edge dive with continuous auto-zoom."
  }
});

export default fractal_zoomerManifest;
