import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FluidSimEffect } from "../fluidSimEffect";

export const fluidManifest = defineEffectManifest({
  key: "fluid",
  className: "FluidSimEffect",
  sourcePath: "src/renderer/effects/fluidSimEffect.ts",
  createEffect: () => new FluidSimEffect(),
  debug: {
    title: "Fluid Simulation Controls",
    controls: [
      numberControl("speed", "Speed", 1, { min: 0, max: 3, step: 0.05 }),
      numberControl("dissipation", "Dissipation", 0.985, { min: 0.9, max: 0.999, step: 0.001 }),
      numberControl("splatCount", "Splat Count", 3, { min: 0, max: 8, step: 1 }),
      numberControl("splatSize", "Splat Size", 6, { min: 2, max: 12, step: 0.5 }),
      numberControl("turbulence", "Turbulence", 1.1, { min: 0, max: 3, step: 0.05 }),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 5 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`speed`, `dissipation`, `splatCount`, `splatSize`, `turbulence`, `hueShift`, `seed`",
    catalogNote: "",
    description: "Fluid Simulation"
  }
});

export default fluidManifest;
