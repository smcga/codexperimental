import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { BoidsSimulationEffect } from "../boidsSimulationEffect";

export const boids_simulationManifest = defineEffectManifest({
  key: "boids_simulation",
  className: "BoidsSimulationEffect",
  sourcePath: "src/renderer/effects/boidsSimulationEffect.ts",
  createEffect: () => new BoidsSimulationEffect(),
  debug: {
    title: "Boids Simulation Controls",
    controls: [
      numberControl("count", "Count", 90, { min: 8, max: 240, step: 1 }),
      numberControl("speed", "Speed", 1, { min: 0.1, max: 3, step: 0.05 }),
      numberControl("cohesion", "Cohesion", 0.22, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("alignment", "Alignment", 0.2, { min: 0, max: 1.2, step: 0.01 }),
      numberControl("separation", "Separation", 0.45, { min: 0, max: 1.6, step: 0.01 }),
      numberControl("neighborRadius", "Neighbor Radius", 54, { min: 8, max: 160, step: 1 }),
      numberControl("separationRadius", "Separation Radius", 18, { min: 4, max: 120, step: 1 }),
      numberControl("trail", "Trail", 0.18, { min: 0.02, max: 0.5, step: 0.01 }),
      numberControl("size", "Size", 2, { min: 1, max: 5, step: 0.1 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 999, step: 1 })
    ]
  },
  docs: {
    parameters: "`count`, `speed`, `cohesion`, `alignment`, `separation`, `neighborRadius`, `separationRadius`, `trail`, `size`, `seed`",
    catalogNote: "Audio-reactive flocking simulation with wraparound space and neon boid trails.",
    description: "Audio-reactive flocking simulation with wraparound space and neon boid trails."
  }
});

export default boids_simulationManifest;
