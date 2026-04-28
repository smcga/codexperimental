import { TransitionDefinition } from "./types";

export const glitchTransition = {
  key: "glitch",
  label: "Glitch",
  visibleInValidator: true,
  draw: (api, context) => api.drawGlitch(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"glitch">;
