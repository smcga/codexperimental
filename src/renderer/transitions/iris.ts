import { TransitionDefinition } from "./types";

export const irisTransition = {
  key: "iris",
  label: "Iris",
  visibleInValidator: true,
  draw: (api, context) => api.drawIris(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"iris">;
