import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ParticleFieldEffect } from "../particleFieldEffect";

export const particlesManifest = defineEffectManifest({
  key: "particles",
  className: "ParticleFieldEffect",
  sourcePath: "src/renderer/effects/particleFieldEffect.ts",
  createEffect: () => new ParticleFieldEffect(),
  debug: {
    title: "Particle Field Controls",
    controls: [
      numberControl("trail", "Trail", 0.2, { min: 0, max: 0.6, step: 0.05 }),
      numberControl("burst", "Burst", 24, { min: 4, max: 80, step: 1 }),
      numberControl("burstAudio", "Burst Audio", 20, { min: 0, max: 60, step: 1 }),
      numberControl("force", "Force", 1, { min: 0.2, max: 4, step: 0.1 }),
      numberControl("forceAudio", "Force Audio", 2, { min: 0, max: 6, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`trail`, `burst`, `burstAudio`, `force`, `forceAudio`",
    catalogNote: "",
    description: "Particle Field"
  }
});

export default particlesManifest;
