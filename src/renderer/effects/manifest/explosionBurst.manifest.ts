import { ExplosionBurstEffect } from "../explosionBurst";
import { defineEffectManifest, numberControl, toggleControl } from "./shared";

export const explosionBurstManifest = defineEffectManifest({
  key: "explosionBurst",
  className: "ExplosionBurstEffect",
  sourcePath: "src/renderer/effects/explosionBurst.ts",
  createEffect: () => new ExplosionBurstEffect(),
  debug: {
    title: "Explosion Burst Controls",
    controls: [
      numberControl("startTime", "Start Time", 0, { min: 0, max: 600, step: 0.01 }),
      numberControl("duration", "Duration", 5, { min: 1, max: 8, step: 0.1 }),
      numberControl("seed", "Seed", 1, { min: 0, max: 9999, step: 1 }),
      numberControl("intensity", "Intensity", 1, { min: 0.5, max: 2, step: 0.01 }),
      numberControl("radius", "Radius", 72, { min: 12, max: 420, step: 1 }),
      numberControl("particleCount", "Fire Count", 180, { min: 0, max: 300, step: 1 }),
      numberControl("smokeCount", "Smoke Count", 120, { min: 0, max: 300, step: 1 }),
      numberControl("debrisCount", "Debris Count", 60, { min: 0, max: 180, step: 1 }),
      numberControl("gravity", "Gravity", 0.02, { min: 0, max: 0.2, step: 0.001 }),
      numberControl("drag", "Drag", 0.985, { min: 0.8, max: 0.999, step: 0.001 }),
      numberControl("turbulence", "Turbulence", 0.6, { min: 0, max: 2, step: 0.01 }),
      numberControl("turbulenceScale", "Turbulence Scale", 0.002, { min: 0.0005, max: 0.01, step: 0.0001 }),
      numberControl("fade", "Fade", 0.98, { min: 0.8, max: 0.999, step: 0.001 }),
      toggleControl("audioReactive", "Audio Reactive", true)
    ]
  },
  docs: {
    parameters:
      "`startTime`, `duration`, `seed`, `intensity`, `radius`, `particleCount`, `smokeCount`, `debrisCount`, `gravity`, `drag`, `turbulence`, `turbulenceScale`, `fade`, `audioReactive`",
    catalogNote:
      "One-shot seeded explosion burst with flash, fireball, debris streaks, and rolling smoke fade for beat-synced impact moments.",
    description:
      "One-shot seeded explosion burst with flash ignition, turbulent flames, debris streaks, and lingering smoke dissipation."
  }
});

export default explosionBurstManifest;
