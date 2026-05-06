import { TransitionDefinition } from "./types";

export const fadeTransition = {
  key: "fade",
  label: "Fade",
  visibleInValidator: true,
  draw: (api, context) => api.drawFade(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"fade">;
