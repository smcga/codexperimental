import { TransitionDefinition } from "./types";

export const neuralFeedbackTransition = {
  key: "neural-feedback",
  label: "Neural Feedback",
  visibleInValidator: true,
  draw: (api, context) => api.drawNeuralFeedback(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"neural-feedback">;
