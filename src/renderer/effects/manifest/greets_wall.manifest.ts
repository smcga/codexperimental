import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { GREETS_WALL_DEFAULTS, GreetsWallEffect } from "../greetsWall";

export const greets_wallManifest = defineEffectManifest({
  key: "greets_wall",
  className: "GreetsWallEffect",
  sourcePath: "src/renderer/effects/greetsWall.ts",
  createEffect: () => new GreetsWallEffect(),
  debug: {
    title: "Greets Wall Controls",
    controls: [
      selectControl("layout", "Layout", GREETS_WALL_DEFAULTS.layout, [
        { label: "Grid", value: "grid" },
        { label: "Carousel", value: "carousel" }
      ]),
      selectControl("transitionStyle", "Transition", GREETS_WALL_DEFAULTS.transitionStyle, [
        { label: "Slide", value: "slide" },
        { label: "Fade", value: "fade" },
        { label: "Pop", value: "pop" }
      ]),
      numberControl("cycleSeconds", "Cycle Seconds", GREETS_WALL_DEFAULTS.cycleSeconds, { min: 0.35, max: 6, step: 0.05 }),
      numberControl("columns", "Columns", GREETS_WALL_DEFAULTS.columns, { min: 1, max: 8, step: 1 }),
      numberControl("padding", "Padding", GREETS_WALL_DEFAULTS.padding, { min: 0.02, max: 0.18, step: 0.01 }),
      numberControl("highlightPulse", "Highlight Pulse", GREETS_WALL_DEFAULTS.highlightPulse, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("beatPulseDecay", "Beat Decay", GREETS_WALL_DEFAULTS.beatPulseDecay, { min: 0.2, max: 8, step: 0.1 }),
      numberControl("audioReact", "Audio React", GREETS_WALL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      selectControl("title", "Title", "GREETS", [{ label: "GREETS", value: "GREETS" }]),
      selectControl("names", "Names", "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL", [
        { label: "Default Names", value: "Fairlight|TRSI|Spaceballs|CNCD|Mercury|TBL" }
      ])
    ]
  },
  docs: {
    parameters: "`names`, `layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title`",
    catalogNote: "`layout` supports `grid` or `carousel`; `transitionStyle` supports `slide`, `fade`, or `pop`.",
    description: "`layout` supports `grid` or `carousel`; `transitionStyle` supports `slide`, `fade`, or `pop`."
  }
});

export default greets_wallManifest;
