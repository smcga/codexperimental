import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FinaleEffect } from "../finaleEffect";

export const finaleManifest = defineEffectManifest({
  key: "finale",
  className: "FinaleEffect",
  sourcePath: "src/renderer/effects/finaleEffect.ts",
  createEffect: () => new FinaleEffect(),
  debug: {
    title: "Finale Controls",
    controls: [
      numberControl("trail", "Trail", 0.4, { min: 0.05, max: 0.8, step: 0.05 }),
      numberControl("starSpeed", "Star Speed", 1.2, { min: 0, max: 4, step: 0.05 }),
      numberControl("starWarp", "Star Warp", 0.9, { min: 0, max: 2, step: 0.05 }),
      numberControl("starTurn", "Star Turn", 0.35, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("particleCount", "Particle Count", 40, { min: 10, max: 120, step: 1 }),
      numberControl("particleForce", "Particle Force", 3, { min: 0.5, max: 6, step: 0.1 }),
      numberControl("bars", "Bars", 32, { min: 8, max: 64, step: 1 }),
      numberControl("barHeight", "Bar Height", 0.6, { min: 0.2, max: 1, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`trail`, `starSpeed`, `starWarp`, `starTurn`, `particleCount`, `particleForce`, `bars`, `barHeight`",
    catalogNote: "",
    description: "Finale"
  }
});

export default finaleManifest;
