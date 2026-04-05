import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { LEMMINGS_MARCH_DEFAULTS, LemmingsMarchEffect } from "../lemmingsMarchEffect";

export const lemmings_marchManifest = defineEffectManifest({
  key: "lemmings_march",
  className: "LemmingsMarchEffect",
  sourcePath: "src/renderer/effects/lemmingsMarchEffect.ts",
  createEffect: () => new LemmingsMarchEffect(),
  debug: {
    title: "Lemmings March Controls",
    controls: [
      numberControl("spawnInterval", "Spawn Interval", LEMMINGS_MARCH_DEFAULTS.spawnInterval, { min: 0.2, max: 3, step: 0.05 }),
      numberControl("colonySize", "Colony Size", LEMMINGS_MARCH_DEFAULTS.colonySize, { min: 4, max: 48, step: 1 }),
      numberControl("worldLength", "World Length", LEMMINGS_MARCH_DEFAULTS.worldLength, { min: 120, max: 640, step: 1 }),
      numberControl("hilliness", "Hilliness", LEMMINGS_MARCH_DEFAULTS.hilliness, { min: 0, max: 1.4, step: 0.05 }),
      numberControl("wallRate", "Wall Rate", LEMMINGS_MARCH_DEFAULTS.wallRate, { min: 0, max: 0.5, step: 0.01 }),
      numberControl("digRate", "Dig Rate", LEMMINGS_MARCH_DEFAULTS.digRate, { min: 2, max: 40, step: 1 }),
      numberControl("bashRate", "Bash Rate", LEMMINGS_MARCH_DEFAULTS.bashRate, { min: 2, max: 40, step: 1 }),
      numberControl("bridgeRate", "Bridge Rate", LEMMINGS_MARCH_DEFAULTS.bridgeRate, { min: 1, max: 12, step: 1 }),
      numberControl("floatiness", "Floatiness", LEMMINGS_MARCH_DEFAULTS.floatiness, { min: 0, max: 1, step: 0.05 }),
      numberControl("scrollFollow", "Scroll Follow", LEMMINGS_MARCH_DEFAULTS.scrollFollow, { min: 0, max: 1, step: 0.05 }),
      numberControl("seed", "Seed", LEMMINGS_MARCH_DEFAULTS.seed, { min: 0, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`spawnInterval`, `colonySize`, `worldLength`, `hilliness`, `wallRate`, `digRate`, `bashRate`, `bridgeRate`, `floatiness`, `scrollFollow`, `seed`",
    catalogNote:
      "Origins-and-Lemmings-inspired colony march through repeating classical pillars, bash/build route edits, and a rescue portal score.",
    description:
      "Origins-and-Lemmings-inspired colony march through repeating classical pillars, bash/build route edits, and a rescue portal score."
  }
});

export default lemmings_marchManifest;
