import { TransitionDefinition } from "./types";

export const chromaticBloomTransition = {
  key: "chromatic-bloom",
  label: "Chromatic Bloom",
  visibleInValidator: true,
  draw: (api, context) => api.drawChromaticBloom(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"chromatic-bloom">;
