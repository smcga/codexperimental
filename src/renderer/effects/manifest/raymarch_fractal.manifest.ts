import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { RaymarchFractalEffect } from "../raymarchFractal";

export const raymarch_fractalManifest = defineEffectManifest({
  key: "raymarch_fractal",
  className: "RaymarchFractalEffect",
  sourcePath: "src/renderer/effects/raymarchFractal.ts",
  createEffect: () => new RaymarchFractalEffect(),
  debug: {
    title: "Raymarch Fractal (WebGL) Controls",
    controls: [
      numberControl("quality", "Quality", 1.0, { min: 0.5, max: 1.5, step: 0.05 }),
      selectControl("fractal", "Fractal", "mandelbulb", [
        { label: "Mandelbulb", value: "mandelbulb" },
        { label: "Mandelbox", value: "mandelbox" }
      ]),
      numberControl("cameraRadius", "Camera Radius", 4.0, { min: 2, max: 8, step: 0.05 }),
      numberControl("cameraHeight", "Camera Height", 0.0, { min: -2, max: 2, step: 0.05 }),
      numberControl("cameraOrbitSpeed", "Camera Orbit Speed", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("paletteSpeed", "Palette Speed", 0.15, { min: 0, max: 0.6, step: 0.01 }),
      numberControl("audioReact", "Audio React", 0.6, { min: 0, max: 1, step: 0.05 }),
      numberControl("beatKick", "Beat Kick", 0.5, { min: 0, max: 1, step: 0.05 }),
      numberControl("fractalScale", "Fractal Scale", 1.0, { min: 0.4, max: 2.2, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`quality`, `fractal`, `cameraRadius`, `cameraHeight`, `cameraOrbitSpeed`, `paletteSpeed`, `audioReact`, `beatKick`, `fractalScale`",
    catalogNote: "`fractal` supports `mandelbulb` or `mandelbox`.",
    description: "`fractal` supports `mandelbulb` or `mandelbox`."
  }
});

export default raymarch_fractalManifest;
