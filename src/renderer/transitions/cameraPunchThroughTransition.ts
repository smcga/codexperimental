import { computeCameraPunchThroughTransitionState } from "./cameraPunchThrough";
import { TransitionDefinition } from "./types";

export const cameraPunchThroughTransition = {
  key: "camera-punch-through",
  label: "Camera Punch-Through",
  visibleInValidator: true,
  draw: (api, context) => api.drawCameraPunchThrough(context),
  drawMobile: (api, context) => api.drawMobileCameraPunchThrough(context),
  createState: ({ progress }) => computeCameraPunchThroughTransitionState(progress)
} as const satisfies TransitionDefinition<"camera-punch-through">;
