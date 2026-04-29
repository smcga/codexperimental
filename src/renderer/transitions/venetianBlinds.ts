import { TransitionDefinition } from "./types";

export const venetianBlindsTransition = {
  key: "venetian-blinds",
  label: "Venetian Blinds",
  visibleInValidator: true,
  draw: (api, context) => api.drawVenetianBlinds(context)
} as const satisfies TransitionDefinition<"venetian-blinds">;
