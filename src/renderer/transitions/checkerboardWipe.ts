import { TransitionDefinition } from "./types";

export const checkerboardWipeTransition = {
  key: "checkerboard-wipe",
  label: "Checkerboard Wipe",
  visibleInValidator: true,
  draw: (api, context) => api.drawCheckerboardWipe(context),
  drawMobile: (api, context) => api.drawMobileCheckerboardWipe(context)
} as const satisfies TransitionDefinition<"checkerboard-wipe">;
