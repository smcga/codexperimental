import { TransitionDefinition } from "./types";

export const fadeTransition = {
  key: "fade",
  label: "Fade",
  visibleInValidator: true,
  draw: (api, context) => api.drawFade(context)
} as const satisfies TransitionDefinition<"fade">;
