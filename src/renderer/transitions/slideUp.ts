import { TransitionDefinition } from "./types";

export const slideUpTransition = {
  key: "slide-up",
  label: "Slide Up",
  visibleInValidator: true,
  draw: (api, context) => api.drawSlide(context, 0, -1)
} as const satisfies TransitionDefinition<"slide-up">;
