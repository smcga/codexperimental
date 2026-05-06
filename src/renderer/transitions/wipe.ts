import { TransitionDefinition } from "./types";

export const wipeTransition = {
  key: "wipe",
  label: "Wipe",
  visibleInValidator: true,
  draw: (api, context) => api.drawWipe(context),
  drawMobile: (api, context) => api.drawMobileWipe(context)
} as const satisfies TransitionDefinition<"wipe">;
