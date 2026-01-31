import { Effect } from "./types";
import { StarfieldEffect } from "./starfieldEffect";
import { PlasmaEffect } from "./plasmaEffect";
import { TunnelEffect } from "./tunnelEffect";
import { RotozoomEffect } from "./rotozoomEffect";
import { BlobsEffect } from "./blobsEffect";
import { RibbonEffect } from "./ribbonEffect";
import { LissajousEffect } from "./lissajousEffect";
import { GlitchEffect } from "./glitchEffect";
import { BokehEffect } from "./bokehEffect";
import { FractalEffect } from "./fractalEffect";
import { FeedbackEffect } from "./feedbackEffect";
import { EqualizerEffect } from "./equalizerEffect";
import { IsoGridEffect } from "./isoGridEffect";
import { NeonShapesEffect } from "./neonShapesEffect";
import { ParticleFieldEffect } from "./particleFieldEffect";
import { FinaleEffect } from "./finaleEffect";
import { Proper3DEffect } from "./proper3dEffect";
import { Fake3DEffect } from "./fake3dEffect";
import { PortraitGlowEffect } from "./portraitGlowEffect";

export const effectRegistry: Record<string, Effect> = {
  starfield: new StarfieldEffect(),
  plasma: new PlasmaEffect(),
  tunnel: new TunnelEffect(),
  rotozoom: new RotozoomEffect(),
  blobs: new BlobsEffect(),
  ribbons: new RibbonEffect(),
  lissajous: new LissajousEffect(),
  glitch: new GlitchEffect(),
  bokeh: new BokehEffect(),
  fractal: new FractalEffect(),
  feedback: new FeedbackEffect(),
  equalizer: new EqualizerEffect(),
  isogrid: new IsoGridEffect(),
  neon: new NeonShapesEffect(),
  particles: new ParticleFieldEffect(),
  finale: new FinaleEffect(),
  proper3d: new Proper3DEffect(),
  fake3d: new Fake3DEffect(),
  portrait: new PortraitGlowEffect()
};

export function resetEffects(): void {
  Object.values(effectRegistry).forEach((effect) => {
    effect.reset?.();
  });
}
