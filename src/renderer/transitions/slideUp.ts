import { TransitionDefinition } from "./types";

export const slideUpTransition = {
  key: "slide-up",
  label: "Slide Up",
  visibleInValidator: true,
  draw: (api, context) => api.drawSlide(context, 0, -1),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"slide-up">;
