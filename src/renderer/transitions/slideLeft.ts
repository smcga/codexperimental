import { TransitionDefinition } from "./types";

export const slideLeftTransition = {
  key: "slide-left",
  label: "Slide Left",
  visibleInValidator: true,
  draw: (api, context) => api.drawSlide(context, -1, 0)
} as const satisfies TransitionDefinition<"slide-left">;
