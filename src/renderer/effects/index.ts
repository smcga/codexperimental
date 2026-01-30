import { EffectDefinition } from "./types";
import { StarfieldEffect } from "./starfield";
import { PlasmaEffect } from "./plasma";
import { TunnelEffect } from "./tunnel";
import { RotozoomEffect } from "./rotozoom";
import { MetaballsEffect } from "./metaballs";
import { RibbonTrailsEffect } from "./ribbons";
import { LissajousEffect } from "./lissajous";
import { GlitchEffect } from "./glitch";
import { BokehEffect } from "./bokeh";
import { FractalFeedbackEffect } from "./fractal";
import { FeedbackZoomEffect } from "./feedback";
import { EqualizerEffect } from "./equalizer";
import { IsoGridEffect } from "./isogrid";
import { NeonShapesEffect } from "./neon";
import { SpiralRingsEffect } from "./spiral";
import { FinaleEffect } from "./finale";

export const effectRegistry = new Map<string, EffectDefinition>([
  ["starfield", new StarfieldEffect()],
  ["plasma", new PlasmaEffect()],
  ["tunnel", new TunnelEffect()],
  ["rotozoom", new RotozoomEffect()],
  ["metaballs", new MetaballsEffect()],
  ["ribbons", new RibbonTrailsEffect()],
  ["lissajous", new LissajousEffect()],
  ["glitch", new GlitchEffect()],
  ["bokeh", new BokehEffect()],
  ["fractal", new FractalFeedbackEffect()],
  ["feedback", new FeedbackZoomEffect()],
  ["equalizer", new EqualizerEffect()],
  ["isogrid", new IsoGridEffect()],
  ["neon", new NeonShapesEffect()],
  ["spiral", new SpiralRingsEffect()],
  ["finale", new FinaleEffect()]
]);
