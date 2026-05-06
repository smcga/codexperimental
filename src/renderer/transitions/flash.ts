import { TransitionDefinition } from "./types";

export const flashTransition = {
  key: "flash",
  label: "Flash",
  visibleInValidator: true,
  draw: (api, context) => api.drawFlash(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"flash">;
