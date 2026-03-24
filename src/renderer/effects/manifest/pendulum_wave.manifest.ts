import { defineEffectManifest, numberControl } from "./shared";
import { PendulumWaveEffect, PENDULUM_WAVE_DEFAULTS } from "../pendulumWaveEffect";

export const pendulum_waveManifest = defineEffectManifest({
  key: "pendulum_wave",
  className: "PendulumWaveEffect",
  sourcePath: "src/renderer/effects/pendulumWaveEffect.ts",
  createEffect: () => new PendulumWaveEffect(),
  debug: {
    title: "Pendulum Wave Controls",
    controls: [
      numberControl("count", "Count", PENDULUM_WAVE_DEFAULTS.count, { min: 5, max: 24, step: 1 }),
      numberControl("spread", "Spread", PENDULUM_WAVE_DEFAULTS.spread, { min: 0.3, max: 0.95, step: 0.01 }),
      numberControl("gravity", "Gravity", PENDULUM_WAVE_DEFAULTS.gravity, { min: 0, max: 1.6, step: 0.01 }),
      numberControl("damping", "Damping", PENDULUM_WAVE_DEFAULTS.damping, { min: 0.02, max: 1.2, step: 0.01 }),
      numberControl("coupling", "Coupling", PENDULUM_WAVE_DEFAULTS.coupling, { min: 0, max: 1.4, step: 0.01 }),
      numberControl("bobRadius", "Bob Radius", PENDULUM_WAVE_DEFAULTS.bobRadius, { min: 0.45, max: 1.6, step: 0.01 }),
      numberControl("trail", "Trail", PENDULUM_WAVE_DEFAULTS.trail, { min: 0.02, max: 0.65, step: 0.01 }),
      numberControl("sway", "Sway", PENDULUM_WAVE_DEFAULTS.sway, { min: 0, max: 1.4, step: 0.01 }),
      numberControl("audioReact", "Audio React", PENDULUM_WAVE_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.01 }),
      numberControl("seed", "Seed", PENDULUM_WAVE_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`count`, `spread`, `gravity`, `damping`, `coupling`, `bobRadius`, `trail`, `sway`, `audioReact`, `seed`",
    catalogNote: "Coupled pendulum array with weighted strings, inertia, and beat-driven impulses.",
    description: "Coupled pendulum array with weighted strings, inertia, and beat-driven impulses."
  }
});

export default pendulum_waveManifest;
