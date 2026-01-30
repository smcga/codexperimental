import type { AudioFeatures } from "../audio/audioPlayer";
import type { SectionState } from "../timeline/timeline";
import type { TextCueConfig } from "../config/loadConfig";
import { clamp, lerp } from "../util/math";
import { renderTextCues } from "./text/textRenderer";
import type { Effect } from "./effects/types";
import { StarfieldEffect } from "./effects/starfieldEffect";
import { PlasmaEffect } from "./effects/plasmaEffect";
import { TunnelEffect } from "./effects/tunnelEffect";
import { RotozoomEffect } from "./effects/rotozoomEffect";
import { MetaballsEffect } from "./effects/metaballsEffect";
import { RibbonsEffect } from "./effects/ribbonsEffect";
import { LissajousEffect } from "./effects/lissajousEffect";
import { GlitchEffect } from "./effects/glitchEffect";
import { BokehEffect } from "./effects/bokehEffect";
import { FractalEffect } from "./effects/fractalEffect";
import { FeedbackEffect } from "./effects/feedbackEffect";
import { EqualizerEffect } from "./effects/equalizerEffect";
import { IsoGridEffect } from "./effects/isoGridEffect";
import { NeonEffect } from "./effects/neonEffect";
import { VortexEffect } from "./effects/vortexEffect";
import { FinaleEffect } from "./effects/finaleEffect";

export type RenderContext = {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  time: number;
  delta: number;
  features: AudioFeatures;
  sectionState: SectionState;
  textCues: TextCueConfig[];
};

export class Renderer {
  private baseCanvas: HTMLCanvasElement;
  private baseCtx: CanvasRenderingContext2D;
  private transitionCanvas: HTMLCanvasElement;
  private transitionCtx: CanvasRenderingContext2D;
  private previousCanvas: HTMLCanvasElement;
  private previousCtx: CanvasRenderingContext2D;
  private effects: Record<string, Effect>;

  constructor(private baseWidth = 320, private baseHeight = 180) {
    this.baseCanvas = document.createElement("canvas");
    this.baseCanvas.width = baseWidth;
    this.baseCanvas.height = baseHeight;
    const baseCtx = this.baseCanvas.getContext("2d");
    if (!baseCtx) {
      throw new Error("Unable to create base canvas");
    }
    this.baseCtx = baseCtx;

    this.transitionCanvas = document.createElement("canvas");
    this.transitionCanvas.width = baseWidth;
    this.transitionCanvas.height = baseHeight;
    const transitionCtx = this.transitionCanvas.getContext("2d");
    if (!transitionCtx) {
      throw new Error("Unable to create transition canvas");
    }
    this.transitionCtx = transitionCtx;

    this.previousCanvas = document.createElement("canvas");
    this.previousCanvas.width = baseWidth;
    this.previousCanvas.height = baseHeight;
    const previousCtx = this.previousCanvas.getContext("2d");
    if (!previousCtx) {
      throw new Error("Unable to create previous canvas");
    }
    this.previousCtx = previousCtx;

    this.effects = {
      starfield: new StarfieldEffect(),
      plasma: new PlasmaEffect(),
      tunnel: new TunnelEffect(),
      rotozoom: new RotozoomEffect(),
      metaballs: new MetaballsEffect(),
      ribbons: new RibbonsEffect(),
      lissajous: new LissajousEffect(),
      glitch: new GlitchEffect(),
      bokeh: new BokehEffect(),
      fractal: new FractalEffect(),
      feedback: new FeedbackEffect(),
      equalizer: new EqualizerEffect(),
      isogrid: new IsoGridEffect(),
      neon: new NeonEffect(),
      vortex: new VortexEffect(),
      finale: new FinaleEffect()
    };
  }

  reset(): void {
    Object.values(this.effects).forEach((effect) => {
      if (effect.reset) {
        effect.reset();
      }
    });
  }

  render({ ctx, width, height, time, delta, features, sectionState, textCues }: RenderContext): void {
    const { section, transition } = sectionState;
    this.clearCanvas(this.baseCtx);

    if (transition) {
      this.clearCanvas(this.previousCtx);
      this.clearCanvas(this.transitionCtx);
      this.renderEffect(
        transition.from.effect,
        this.previousCtx,
        time,
        delta,
        features,
        transition.from.params
      );
      this.renderEffect(
        transition.to.effect,
        this.transitionCtx,
        time,
        delta,
        features,
        transition.to.params
      );
      this.composeTransition(transition);
    } else {
      this.renderEffect(section.effect, this.baseCtx, time, delta, features, section.params);
    }

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / this.baseWidth, height / this.baseHeight);
    const drawWidth = this.baseWidth * scale;
    const drawHeight = this.baseHeight * scale;
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;

    const shake = features.beatStrength * 6;
    const shakeX = (Math.random() - 0.5) * shake;
    const shakeY = (Math.random() - 0.5) * shake;
    ctx.translate(shakeX, shakeY);

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.baseCanvas, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    this.renderOverlay(ctx, width, height, features);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    renderTextCues(ctx, textCues, time, this.baseWidth, this.baseHeight);
    ctx.restore();
  }

  private renderEffect(
    name: string,
    ctx: CanvasRenderingContext2D,
    time: number,
    delta: number,
    features: AudioFeatures,
    params?: Record<string, unknown>
  ): void {
    const effect = this.effects[name];
    if (!effect) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, this.baseWidth, this.baseHeight);
      ctx.fillStyle = "#fff";
      ctx.font = "16px Courier New";
      ctx.fillText(`Missing effect: ${name}`, 10, 20);
      return;
    }

    effect.render({
      ctx,
      width: this.baseWidth,
      height: this.baseHeight,
      time,
      delta,
      features,
      params
    });
  }

  private composeTransition(transition: NonNullable<SectionState["transition"]>): void {
    const { progress, type } = transition;
    this.baseCtx.save();
    this.baseCtx.globalAlpha = 1;
    this.baseCtx.drawImage(this.previousCanvas, 0, 0);
    if (type === "wipe") {
      this.baseCtx.save();
      this.baseCtx.beginPath();
      this.baseCtx.rect(0, 0, this.baseWidth * progress, this.baseHeight);
      this.baseCtx.clip();
      this.baseCtx.drawImage(this.transitionCanvas, 0, 0);
      this.baseCtx.restore();
    } else {
      this.baseCtx.globalAlpha = clamp(progress, 0, 1);
      this.baseCtx.drawImage(this.transitionCanvas, 0, 0);
    }
    this.baseCtx.restore();
  }

  private clearCanvas(ctx: CanvasRenderingContext2D): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.baseWidth, this.baseHeight);
  }

  private renderOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    features: AudioFeatures
  ): void {
    const scanlineAlpha = lerp(0.05, 0.2, features.mid + features.treble * 0.3);
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(0, 0, 0, ${scanlineAlpha})`;
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.8
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.5)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const glitchAmount = clamp(features.treble + features.beatStrength * 0.5, 0, 1);
    if (glitchAmount > 0.2) {
      const slices = Math.floor(2 + glitchAmount * 6);
      for (let i = 0; i < slices; i += 1) {
        const sliceHeight = 6 + Math.random() * 16;
        const y = Math.random() * (height - sliceHeight);
        const offset = (Math.random() - 0.5) * 24 * glitchAmount;
        ctx.drawImage(ctx.canvas, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
      }
    }
  }
}
