import { TransitionDefinition } from "./types";

export const portalZoomTransition = {
  key: "portal-zoom",
  label: "Portal Zoom",
  visibleInValidator: true,
  draw: (api, context) => api.drawPortalZoom(context)
} as const satisfies TransitionDefinition<"portal-zoom">;
