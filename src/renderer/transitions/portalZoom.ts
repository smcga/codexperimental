import { TransitionDefinition } from "./types";

export const portalZoomTransition = {
  key: "portal-zoom",
  label: "Portal Zoom",
  visibleInValidator: true,
  draw: (api, context) => api.drawPortalZoom(context),
  drawMobile: (api, context) => api.drawMobileDefaultCrossfade(context)
} as const satisfies TransitionDefinition<"portal-zoom">;
