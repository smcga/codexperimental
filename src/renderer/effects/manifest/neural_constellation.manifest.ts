import { defineEffectManifest, numberControl } from "./shared";
import { NEURAL_CONSTELLATION_DEFAULTS, NeuralConstellationEffect } from "../neuralConstellation";

export const neural_constellationManifest = defineEffectManifest({
  key: "neural_constellation",
  className: "NeuralConstellationEffect",
  sourcePath: "src/renderer/effects/neuralConstellation.ts",
  createEffect: () => new NeuralConstellationEffect(),
  debug: {
    title: "Neural Constellation Controls",
    controls: [
      numberControl("layers", "Layers", NEURAL_CONSTELLATION_DEFAULTS.layers, { min: 3, max: 8, step: 1 }),
      numberControl("neurons", "Neurons Per Layer", NEURAL_CONSTELLATION_DEFAULTS.neurons, { min: 3, max: 16, step: 1 }),
      numberControl("pulseSpeed", "Pulse Speed", NEURAL_CONSTELLATION_DEFAULTS.pulseSpeed, { min: 0.1, max: 4, step: 0.05 }),
      numberControl("glow", "Glow", NEURAL_CONSTELLATION_DEFAULTS.glow, { min: 0, max: 2, step: 0.05 }),
      numberControl("hue", "Base Hue", NEURAL_CONSTELLATION_DEFAULTS.hue, { min: 0, max: 360, step: 1 }),
      numberControl("drift", "Node Drift", NEURAL_CONSTELLATION_DEFAULTS.drift, { min: 0, max: 2, step: 0.05 }),
      numberControl("audioReact", "Audio React", NEURAL_CONSTELLATION_DEFAULTS.audioReact, { min: 0, max: 2, step: 0.05 }),
      numberControl("seed", "Seed", NEURAL_CONSTELLATION_DEFAULTS.seed, { min: 1, max: 9999, step: 1 })
    ]
  },
  docs: {
    parameters: "`layers`, `neurons`, `pulseSpeed`, `glow`, `hue`, `drift`, `audioReact`, `seed`",
    catalogNote:
      "Glowing deep-network constellation with inference pulse waves sweeping input to output; audio energy boosts glow and pulse intensity.",
    description:
      "Glowing deep-network constellation with inference pulse waves sweeping input to output; audio energy boosts glow and pulse intensity."
  }
});

export default neural_constellationManifest;
