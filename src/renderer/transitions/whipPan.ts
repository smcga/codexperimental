import { TransitionDefinition } from "./types";

export const whipPanTransition = {
  key: "whip-pan",
  label: "Whip Pan",
  visibleInValidator: true,
  draw: (api, context) => api.drawWhipPan(context)
} as const satisfies TransitionDefinition<"whip-pan">;
