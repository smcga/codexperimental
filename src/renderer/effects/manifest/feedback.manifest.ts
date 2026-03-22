import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { FeedbackEffect } from "../feedbackEffect";

export const feedbackManifest = defineEffectManifest({
  key: "feedback",
  className: "FeedbackEffect",
  sourcePath: "src/renderer/effects/feedbackEffect.ts",
  createEffect: () => new FeedbackEffect(),
  debug: {
    title: "Feedback Controls",
    controls: [
      numberControl("scale", "Scale", 0.02, { min: 0, max: 0.2, step: 0.005 }),
      numberControl("wobble", "Wobble", 0.01, { min: 0, max: 0.05, step: 0.005 }),
      numberControl("rotation", "Rotation", 0.02, { min: 0, max: 0.1, step: 0.005 }),
      numberControl("trail", "Trail", 0.96, { min: 0.85, max: 0.99, step: 0.01 }),
      numberControl("glow", "Glow", 0.2, { min: 0.05, max: 0.6, step: 0.05 })
    ]
  },
  docs: {
    parameters: "`scale`, `wobble`, `rotation`, `trail`, `glow`",
    catalogNote: "",
    description: "Feedback"
  }
});

export default feedbackManifest;
