import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { ChessEffect } from "../chessEffect";

export const chessManifest = defineEffectManifest({
  key: "chess",
  className: "ChessEffect",
  sourcePath: "src/renderer/effects/chessEffect.ts",
  createEffect: () => new ChessEffect(),
  debug: {
    title: "Chess Controls",
    controls: [
      numberControl("speed", "Speed", 1.0, { min: 0.1, step: 0.05 }),
      toggleControl("showHighlights", "Show Highlights", true),
      numberControl("startTime", "Start Time", 0, { min: 0, step: 0.1 })
    ]
  },
  docs: {
    parameters: "`speed`, `showHighlights`, `startTime`",
    catalogNote: "Deterministic self-playing chess match with clearer silhouette-led pieces, distinctive major-piece markers, and move highlights.",
    description: "Deterministic self-playing chess match with clearer silhouette-led pieces, distinctive major-piece markers, and move highlights."
  }
});

export default chessManifest;
