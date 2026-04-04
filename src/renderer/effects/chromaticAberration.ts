import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export type ChromaticAberrationMode = "rgb" | "rg" | "rb" | "gb";

export const CHROMATIC_ABERRATION_DEFAULTS = {
  strength: 0.006,
  falloff: 1.6,
  angle: 0,
  centerX: 0.5,
  centerY: 0.5,
  sampleStep: 1,
  alpha: 1,
  animate: 0,
  edgeBoost: 0,
  mode: "rgb" as ChromaticAberrationMode
};

export type ResolvedChromaticAberrationParams = {
  strength: number;
  falloff: number;
  angle: number;
  centerX: number;
  centerY: number;
  sampleStep: number;
  alpha: number;
  animate: number;
  edgeBoost: number;
  mode: ChromaticAberrationMode;
};

const getNumberParam = (value: unknown, fallback: number): number => (typeof value === "number" ? value : fallback);
const getStringParam = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

const clampSampleCoord = (value: number, limit: number): number => clamp(Math.round(value), 0, Math.max(0, limit - 1));

const sampleChannel = (source: Uint8ClampedArray, width: number, height: number, x: number, y: number, channelOffset: number): number => {
  const sx = clampSampleCoord(x, width);
  const sy = clampSampleCoord(y, height);
  return source[(sy * width + sx) * 4 + channelOffset];
};

export const resolveChromaticAberrationParams = (params: Record<string, unknown>): ResolvedChromaticAberrationParams => {
  const rawMode = getStringParam(params.mode, CHROMATIC_ABERRATION_DEFAULTS.mode);
  const mode = rawMode === "rg" || rawMode === "rb" || rawMode === "gb" || rawMode === "rgb" ? rawMode : "rgb";

  return {
    strength: clamp(getNumberParam(params.strength, CHROMATIC_ABERRATION_DEFAULTS.strength), 0, 0.08),
    falloff: clamp(getNumberParam(params.falloff, CHROMATIC_ABERRATION_DEFAULTS.falloff), 0.2, 4),
    angle: clamp(getNumberParam(params.angle, CHROMATIC_ABERRATION_DEFAULTS.angle), -Math.PI, Math.PI),
    centerX: clamp(getNumberParam(params.centerX, CHROMATIC_ABERRATION_DEFAULTS.centerX), 0, 1),
    centerY: clamp(getNumberParam(params.centerY, CHROMATIC_ABERRATION_DEFAULTS.centerY), 0, 1),
    sampleStep: Math.max(1, Math.round(getNumberParam(params.sampleStep, CHROMATIC_ABERRATION_DEFAULTS.sampleStep))),
    alpha: clamp(getNumberParam(params.alpha, CHROMATIC_ABERRATION_DEFAULTS.alpha), 0, 1),
    animate: clamp(getNumberParam(params.animate, CHROMATIC_ABERRATION_DEFAULTS.animate), 0, 4),
    edgeBoost: clamp(getNumberParam(params.edgeBoost, CHROMATIC_ABERRATION_DEFAULTS.edgeBoost), 0, 3),
    mode
  };
};

export const applyChromaticAberrationToData = (
  source: Uint8ClampedArray,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  time: number,
  params: ResolvedChromaticAberrationParams
): void => {
  const minDimension = Math.max(1, Math.min(width, height));
  const centerX = params.centerX * (width - 1);
  const centerY = params.centerY * (height - 1);
  const maxDistance = Math.hypot(Math.max(centerX, width - 1 - centerX), Math.max(centerY, height - 1 - centerY)) || 1;
  const biasX = Math.cos(params.angle);
  const biasY = Math.sin(params.angle);
  const directionBias = Math.abs(params.angle) > 1e-4 ? 0.3 : 0;
  const animatedStrength =
    params.strength * (1 + Math.sin(time * 0.6) * 0.2 * params.animate + Math.sin(time * 0.18 + 1.4) * 0.08 * params.animate);

  for (let y = 0; y < height; y += params.sampleStep) {
    for (let x = 0; x < width; x += params.sampleStep) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.hypot(dx, dy);
      const distanceNorm = clamp(distance / maxDistance, 0, 1);
      const radialX = distance > 1e-5 ? dx / distance : biasX;
      const radialY = distance > 1e-5 ? dy / distance : biasY;
      const dirXUnnormalized = radialX * (1 - directionBias) + biasX * directionBias;
      const dirYUnnormalized = radialY * (1 - directionBias) + biasY * directionBias;
      const dirLength = Math.hypot(dirXUnnormalized, dirYUnnormalized) || 1;
      const dirX = dirXUnnormalized / dirLength;
      const dirY = dirYUnnormalized / dirLength;
      const edgeFactor = 1 + params.edgeBoost * distanceNorm * distanceNorm;
      const offsetPx = animatedStrength * minDimension * Math.pow(distanceNorm, params.falloff) * edgeFactor;

      const centerR = sampleChannel(source, width, height, x, y, 0);
      const centerG = sampleChannel(source, width, height, x, y, 1);
      const centerB = sampleChannel(source, width, height, x, y, 2);
      const sourceA = sampleChannel(source, width, height, x, y, 3);

      const outX = x + dirX * offsetPx;
      const outY = y + dirY * offsetPx;
      const inX = x - dirX * offsetPx;
      const inY = y - dirY * offsetPx;

      let red = centerR;
      let green = centerG;
      let blue = centerB;

      if (params.mode === "rgb") {
        red = sampleChannel(source, width, height, outX, outY, 0);
        blue = sampleChannel(source, width, height, inX, inY, 2);
      } else if (params.mode === "rg") {
        red = sampleChannel(source, width, height, outX, outY, 0);
        green = sampleChannel(source, width, height, inX, inY, 1);
      } else if (params.mode === "rb") {
        red = sampleChannel(source, width, height, outX, outY, 0);
        blue = sampleChannel(source, width, height, inX, inY, 2);
      } else if (params.mode === "gb") {
        green = sampleChannel(source, width, height, outX, outY, 1);
        blue = sampleChannel(source, width, height, inX, inY, 2);
      }

      const blendedR = Math.round(centerR + (red - centerR) * params.alpha);
      const blendedG = Math.round(centerG + (green - centerG) * params.alpha);
      const blendedB = Math.round(centerB + (blue - centerB) * params.alpha);

      for (let oy = y; oy < Math.min(height, y + params.sampleStep); oy += 1) {
        for (let ox = x; ox < Math.min(width, x + params.sampleStep); ox += 1) {
          const idx = (oy * width + ox) * 4;
          output[idx] = blendedR;
          output[idx + 1] = blendedG;
          output[idx + 2] = blendedB;
          output[idx + 3] = sourceA;
        }
      }
    }
  }
};

export class ChromaticAberrationEffect implements Effect {
  private sourceCanvas: HTMLCanvasElement;
  private sourceCtx: CanvasRenderingContext2D;

  constructor() {
    this.sourceCanvas = document.createElement("canvas");
    const sourceCtx = this.sourceCanvas.getContext("2d", { willReadFrequently: true });
    if (!sourceCtx) {
      throw new Error("Unable to create chromatic aberration source buffer");
    }
    this.sourceCtx = sourceCtx;
  }

  private ensureSize(width: number, height: number): void {
    if (this.sourceCanvas.width === width && this.sourceCanvas.height === height) {
      return;
    }
    this.sourceCanvas.width = width;
    this.sourceCanvas.height = height;
  }

  render({ ctx, width, height, time, params, sourceCanvas }: EffectRenderContext): void {
    this.ensureSize(width, height);
    const resolved = resolveChromaticAberrationParams(params as Record<string, unknown>);
    const source = sourceCanvas ?? ctx.canvas;

    this.sourceCtx.clearRect(0, 0, width, height);
    this.sourceCtx.drawImage(source, 0, 0, width, height);

    const sourceImage = this.sourceCtx.getImageData(0, 0, width, height);
    const outputImage = this.sourceCtx.createImageData(width, height);

    applyChromaticAberrationToData(sourceImage.data, outputImage.data, width, height, time, resolved);

    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(outputImage, 0, 0);
  }
}
