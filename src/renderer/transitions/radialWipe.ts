import { TransitionDefinition } from "./types";

export const radialWipeTransition = {
  key: "radial-wipe",
  label: "Radial Wipe",
  visibleInValidator: true,
  draw: (api, context) => api.drawRadialWipe(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"radial-wipe">;
