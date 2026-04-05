import { SmokeSimulationEffect } from "../smokeSimulation";
import { defineEffectManifest, numberControl, selectControl } from "./shared";

export const smoke_simulationManifest = defineEffectManifest({
  key: "smoke_simulation",
  className: "SmokeSimulationEffect",
  sourcePath: "src/renderer/effects/smokeSimulation.ts",
  createEffect: () => new SmokeSimulationEffect(),
  debug: {
    title: "Smoke Simulation Controls",
    controls: [
      numberControl("density", "Density", 0.8, { min: 0, max: 1.3, step: 0.01 }),
      numberControl("flowSpeed", "Flow Speed", 0.6, { min: 0, max: 2, step: 0.01 }),
      numberControl("turbulence", "Turbulence", 0.7, { min: 0, max: 2, step: 0.01 }),
      numberControl("swirl", "Swirl", 0.8, { min: 0, max: 2, step: 0.01 }),
      numberControl("diffusion", "Diffusion", 0.92, { min: 0, max: 1, step: 0.01 }),
      numberControl("softness", "Softness", 0.8, { min: 0, max: 1, step: 0.01 }),
      numberControl("emission", "Emission", 0.5, { min: 0, max: 1.5, step: 0.01 }),
      selectControl("emitMode", "Emit Mode", "bottom", [
        { label: "Centre", value: "centre" },
        { label: "Bottom", value: "bottom" },
        { label: "Random", value: "random" }
      ]),
      numberControl("scale", "Scale", 1, { min: 0.5, max: 2.2, step: 0.01 }),
      selectControl("colorMode", "Color Mode", "mono", [
        { label: "Mono", value: "mono" },
        { label: "Tinted", value: "tinted" }
      ]),
      numberControl("hueShift", "Hue Shift", 0, { min: -180, max: 180, step: 1 }),
      numberControl("audioReactive", "Audio Reactive", 1, { min: 0, max: 1, step: 0.01 }),
      numberControl("bassInfluence", "Bass Influence", 0.9, { min: 0, max: 2, step: 0.01 }),
      numberControl("midInfluence", "Mid Influence", 0.6, { min: 0, max: 2, step: 0.01 }),
      numberControl("trebleInfluence", "Treble Influence", 0.5, { min: 0, max: 2, step: 0.01 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 9999, step: 1 }),
      numberControl("highlights", "Highlights", 0.45, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters:
      "`density`, `flowSpeed`, `turbulence`, `swirl`, `diffusion`, `softness`, `emission`, `emitMode`, `scale`, `colorMode`, `hueShift`, `audioReactive`, `bassInfluence`, `midInfluence`, `trebleInfluence`, `seed`, `highlights`",
    catalogNote: "`emitMode` supports `centre`, `bottom`, `random`; `colorMode` supports `mono` or `tinted`.",
    description: "Low-res advection smoke with flow-field feedback and soft composited wisps."
  }
});

export default smoke_simulationManifest;
