import { TransitionDefinition } from "./types";

export const noiseThresholdTransition = {
  key: "noise-threshold",
  label: "Noise Threshold",
  visibleInValidator: true,
  draw: (api, context) => api.drawNoiseThreshold(context)
} as const satisfies TransitionDefinition<"noise-threshold">;
