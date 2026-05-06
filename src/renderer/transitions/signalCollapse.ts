import { TransitionDefinition } from "./types";

export const signalCollapseTransition = {
  key: "signal-collapse",
  label: "Signal Collapse",
  visibleInValidator: true,
  draw: (api, context) => api.drawSignalCollapse(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"signal-collapse">;
