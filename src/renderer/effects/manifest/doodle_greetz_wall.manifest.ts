import { defineEffectManifest, numberControl, selectControl, toggleControl } from "./shared";
import { DOODLE_GREETZ_WALL_DEFAULTS, DoodleGreetzWallEffect } from "../doodleGreetzWall";

export const doodle_greetz_wallManifest = defineEffectManifest({
  key: "doodle_greetz_wall",
  className: "DoodleGreetzWallEffect",
  sourcePath: "src/renderer/effects/doodleGreetzWall.ts",
  createEffect: () => new DoodleGreetzWallEffect(),
  debug: {
    title: "Doodle Greetz Wall Controls",
    controls: [
      selectControl("layout", "Layout", DOODLE_GREETZ_WALL_DEFAULTS.layout, [
        { label: "Grid", value: "grid" },
        { label: "Carousel", value: "carousel" }
      ]),
      selectControl("transitionStyle", "Transition", DOODLE_GREETZ_WALL_DEFAULTS.transitionStyle, [
        { label: "Slide", value: "slide" },
        { label: "Fade", value: "fade" },
        { label: "Pop", value: "pop" }
      ]),
      numberControl("cycleSeconds", "Cycle Seconds", DOODLE_GREETZ_WALL_DEFAULTS.cycleSeconds, { min: 0.35, max: 6, step: 0.05 }),
      numberControl("columns", "Columns", DOODLE_GREETZ_WALL_DEFAULTS.columns, { min: 1, max: 8, step: 1 }),
      numberControl("padding", "Padding", DOODLE_GREETZ_WALL_DEFAULTS.padding, { min: 0.02, max: 0.18, step: 0.01 }),
      numberControl("highlightPulse", "Highlight Pulse", DOODLE_GREETZ_WALL_DEFAULTS.highlightPulse, { min: 0, max: 1.5, step: 0.05 }),
      numberControl("beatPulseDecay", "Beat Decay", DOODLE_GREETZ_WALL_DEFAULTS.beatPulseDecay, { min: 0.2, max: 8, step: 0.1 }),
      numberControl("audioReact", "Audio React", DOODLE_GREETZ_WALL_DEFAULTS.audioReact, { min: 0, max: 1, step: 0.05 }),
      selectControl("title", "Title", DOODLE_GREETZ_WALL_DEFAULTS.title, [{ label: DOODLE_GREETZ_WALL_DEFAULTS.title, value: DOODLE_GREETZ_WALL_DEFAULTS.title }])
    ]
  },
  docs: {
    parameters: "`layout`, `transitionStyle`, `cycleSeconds`, `columns`, `padding`, `highlightPulse`, `beatPulseDecay`, `audioReact`, `title`",
    catalogNote: "Pulls approved PNG doodles from the doodle API and renders them in `grid` or `carousel` layouts.",
    description: "Pulls approved PNG doodles from the doodle API and renders them in `grid` or `carousel` layouts."
  }
});

export default doodle_greetz_wallManifest;
