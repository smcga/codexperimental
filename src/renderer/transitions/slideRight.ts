import { TransitionDefinition } from "./types";

export const slideRightTransition = {
  key: "slide-right",
  label: "Slide Right",
  visibleInValidator: true,
  draw: (api, context) => api.drawSlide(context, 1, 0),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"slide-right">;
