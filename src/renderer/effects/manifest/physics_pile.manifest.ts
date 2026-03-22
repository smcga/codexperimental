import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { PhysicsPileEffect } from "../physicsPile";

export const physics_pileManifest = defineEffectManifest({
  key: "physics_pile",
  className: "PhysicsPileEffect",
  sourcePath: "src/renderer/effects/physicsPile.ts",
  createEffect: () => new PhysicsPileEffect(),
  debug: {
    title: "Physics Pile Controls",
    controls: [
      numberControl("count", "Count", 18, { min: 5, max: 120, step: 1 }),
      numberControl("restitution", "Restitution", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("friction", "Friction", 0.6, { min: 0, max: 1, step: 0.01 }),
      numberControl("gravity", "Gravity", 900, { min: 0, max: 2400, step: 10 }),
      numberControl("kickImpulse", "Kick Impulse", 250, { min: 0, max: 3000, step: 10 }),
      numberControl("beatImpulse", "Beat Impulse", 250, { min: 0, max: 3000, step: 10 }),
      numberControl("kickRadius", "Kick Radius", 240, { min: 1, max: 1000, step: 1 }),
      numberControl("scatterAngleDeg", "Scatter Angle", 25, { min: 0, max: 180, step: 1 }),
      numberControl("scatterJitter", "Scatter Jitter", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("kickUpBias", "Kick Up Bias", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("kickTorque", "Kick Torque", 35, { min: 0, max: 360, step: 1 }),
      numberControl("loosenDuration", "Loosen Duration", 0.18, { min: 0, max: 5, step: 0.01 }),
      numberControl("loosenFrictionMult", "Loosen Friction Mult", 0.25, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenRestitutionAdd", "Loosen Restitution Add", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenPosCorrMult", "Loosen Position Correction Mult", 0.35, { min: 0, max: 1, step: 0.01 }),
      numberControl("loosenExtraSlop", "Loosen Extra Slop", 1.5, { min: 0, max: 10, step: 0.1 }),
      numberControl("maxLinVel", "Max Linear Velocity", 1800, { min: 0, max: 5000, step: 10 }),
      numberControl("maxAngVel", "Max Angular Velocity", 18, { min: 0, max: 360, step: 1 }),
      numberControl("kickOriginY", "Kick Origin Y", 0),
      numberControl("sepBiasDeg", "Separation Bias", 10, { min: 0, max: 180, step: 1 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 9999, step: 1 }),
      numberControl("trail", "Trail", 0.2, { min: 0, max: 1, step: 0.01 }),
      numberControl("shatter", "Shatter", 0, { min: 0, max: 1, step: 0.01 }),
      numberControl("wreckingCue", "Wrecking Cue", 0, { min: 0, max: 1, step: 0.01 })
    ]
  },
  docs: {
    parameters: "`count`, `restitution`, `friction`, `gravity`, `kickImpulse`, `beatImpulse`, `kickRadius`, `scatterAngleDeg`, `scatterJitter`, `kickUpBias`, `kickTorque`, `loosenDuration`, `loosenFrictionMult`, `loosenRestitutionAdd`, `loosenPosCorrMult`, `loosenExtraSlop`, `maxLinVel`, `maxAngVel`, `kickOrigin`, `kickOriginY`, `sepBiasDeg`, `spawnMode`, `trail`, `seed`, `wreckingCue`, `shatter`",
    catalogNote: "`spawnMode` supports `pile` or `rain`.",
    description: "`spawnMode` supports `pile` or `rain`."
  }
});

export default physics_pileManifest;
