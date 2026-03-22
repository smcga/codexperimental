import { computeShatterTransitionState } from "./shatter";
import { TransitionDefinition } from "./types";

export const shatterTransition = {
  key: "shatter",
  label: "Shatter",
  visibleInValidator: true,
  draw: (api, context) => api.drawShatter(context),
  drawMobile: (api, context) => api.drawMobileShatter(context),
  createState: ({ progress, width, height, audio }) =>
    computeShatterTransitionState(progress, width, height, audio.beatStrength + audio.bass * 0.35)
} as const satisfies TransitionDefinition<"shatter">;
