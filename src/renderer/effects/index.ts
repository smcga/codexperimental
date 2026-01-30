import type { Effect } from "./types";
import { StarfieldEffect } from "./starfieldEffect";
import { PlasmaEffect } from "./plasmaEffect";
import { TunnelEffect } from "./tunnelEffect";
import { RotozoomEffect } from "./rotozoomEffect";
import { MetaballsEffect } from "./metaballsEffect";
import { RibbonEffect } from "./ribbonEffect";
import { LissajousEffect } from "./lissajousEffect";
import { GlitchEffect } from "./glitchEffect";
import { BokehEffect } from "./bokehEffect";
import { FractalEffect } from "./fractalEffect";
import { FeedbackEffect } from "./feedbackEffect";
import { EqualizerEffect } from "./equalizerEffect";
import { IsoGridEffect } from "./isogridEffect";
import { NeonEffect } from "./neonEffect";
import { CheckerEffect } from "./checkerEffect";
import { FinaleEffect } from "./finaleEffect";

export type EffectName =
  | "starfield"
  | "plasma"
  | "tunnel"
  | "rotozoom"
  | "metaballs"
  | "ribbon"
  | "lissajous"
  | "glitch"
  | "bokeh"
  | "fractal"
  | "feedback"
  | "equalizer"
  | "isogrid"
  | "neon"
  | "checker"
  | "finale";

export function createEffectRegistry(): Record<string, Effect> {
  return {
    starfield: new StarfieldEffect(),
    plasma: new PlasmaEffect(),
    tunnel: new TunnelEffect(),
    rotozoom: new RotozoomEffect(),
    metaballs: new MetaballsEffect(),
    ribbon: new RibbonEffect(),
    lissajous: new LissajousEffect(),
    glitch: new GlitchEffect(),
    bokeh: new BokehEffect(),
    fractal: new FractalEffect(),
    feedback: new FeedbackEffect(),
    equalizer: new EqualizerEffect(),
    isogrid: new IsoGridEffect(),
    neon: new NeonEffect(),
    checker: new CheckerEffect(),
    finale: new FinaleEffect()
  };
}
