import { TransitionDefinition } from "./types";

export const slideDownTransition = {
  key: "slide-down",
  label: "Slide Down",
  visibleInValidator: true,
  draw: (api, context) => api.drawSlide(context, 0, 1),
  drawMobile: (api, context) => api.drawMobileSlide(context, 0, 1)
} as const satisfies TransitionDefinition<"slide-down">;
