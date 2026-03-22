import { computeBitplaneWipeTransitionState } from "./bitplaneWipe";
import { TransitionDefinition } from "./types";

export const bitplaneWipeTransition = {
  key: "bitplane-wipe",
  label: "Bitplane Wipe",
  visibleInValidator: true,
  draw: (api, context) => api.drawBitplaneWipe(context),
  drawMobile: (api, context) => api.drawMobileBitplaneWipe(context),
  createState: ({ progress, width }) => computeBitplaneWipeTransitionState(progress, width)
} as const satisfies TransitionDefinition<"bitplane-wipe">;
