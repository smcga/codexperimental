import { clamp } from "../../util/math";
import { SsaoPostWebGLEffect } from "./gl/ssaoPostEffect";
import { Effect, EffectRenderContext } from "./types";
import { applySsaoCanvas, SsaoPostParams } from "./ssaoPostCanvas";

export const SSAO_POST_DEFAULTS: SsaoPostParams = {
  radius: 6,
  intensity: 0.6,
  bias: 0.1,
  samples: 8,
  luminanceInfluence: 0.7,
  edgeBoost: 0.5
};

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveParams = (params: Record<string, number>, isMobile: boolean): SsaoPostParams => {
  const samples = clamp(toNumber(params.samples, SSAO_POST_DEFAULTS.samples), 1, 8);
  const radius = clamp(toNumber(params.radius, SSAO_POST_DEFAULTS.radius), 1, 20);
  const lowPerfScale = isMobile ? 0.85 : 1;
  return {
    radius: radius * lowPerfScale,
    intensity: clamp(toNumber(params.intensity, SSAO_POST_DEFAULTS.intensity), 0, 1.2),
    bias: clamp(toNumber(params.bias, SSAO_POST_DEFAULTS.bias), -1, 1),
    samples: isMobile ? Math.min(4, samples) : samples,
    luminanceInfluence: clamp(toNumber(params.luminanceInfluence, SSAO_POST_DEFAULTS.luminanceInfluence), 0, 1),
    edgeBoost: clamp(toNumber(params.edgeBoost, SSAO_POST_DEFAULTS.edgeBoost), 0, 2)
  };
};

export class SsaoPostEffect implements Effect {
  private webgl: SsaoPostWebGLEffect | null = null;
  private sourceCanvas: HTMLCanvasElement;
  private sourceCtx: CanvasRenderingContext2D;

  constructor() {
    this.sourceCanvas = document.createElement("canvas");
    const sourceCtx = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) {
      throw new Error("Unable to create SSAO source canvas");
    }
    this.sourceCtx = sourceCtx;
    this.webgl = new SsaoPostWebGLEffect();
  }

  render({ ctx, width, height, params, framing }: EffectRenderContext): void {
    if (width <= 0 || height <= 0) {
      return;
    }

    if (this.sourceCanvas.width !== width || this.sourceCanvas.height !== height) {
      this.sourceCanvas.width = width;
      this.sourceCanvas.height = height;
    }

    this.sourceCtx.clearRect(0, 0, width, height);
    this.sourceCtx.drawImage(ctx.canvas, 0, 0, width, height);

    const resolved = resolveParams(params, framing?.mode === "mobileFit");

    if (this.webgl?.available && this.webgl.apply(this.sourceCanvas, width, height, resolved)) {
      ctx.clearRect(0, 0, width, height);
      this.webgl.drawTo(ctx, width, height);
      return;
    }

    applySsaoCanvas(ctx, width, height, resolved, this.sourceCanvas);
  }
}
