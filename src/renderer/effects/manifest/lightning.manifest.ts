import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { LightningEffect } from "../lightningEffect";

export const lightningManifest = defineEffectManifest({
  key: "lightning",
  className: "LightningEffect",
  sourcePath: "src/renderer/effects/lightningEffect.ts",
  createEffect: () => new LightningEffect(),
  debug: {
    title: "Lightning Controls",
    controls: [
      numberControl("chancePerSecond", "Chance / second", 0.25, { min: 0, max: 3, step: 0.05 }),
      numberControl("cooldown", "Cooldown", 1.5, { min: 0, max: 5, step: 0.05 }),
      numberControl("flashDuration", "Flash Duration", 0.12, { min: 0.05, max: 2, step: 0.01 }),
      numberControl("branches", "Branches", 1, { min: 1, max: 8, step: 1 }),
      toggleControl("bolt", "Bolt", true),
      numberControl("trigger", "Trigger", 0, { min: 0, max: 1, step: 1 }),
      numberControl("seed", "Seed", 0, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`trigger`, `chancePerSecond`, `cooldown`, `flashDuration`, `bolt`, `branches`, `seed`",
    catalogNote: "`trigger` supports `beat`, `random`, `both`.",
    description: "`trigger` supports `beat`, `random`, `both`."
  }
});

export default lightningManifest;
