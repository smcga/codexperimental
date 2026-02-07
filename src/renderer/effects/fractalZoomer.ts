import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const RESOLUTION_SCALE = 0.32;
const MIN_INTERNAL_SIZE = 96;
const MAX_INTERNAL_SIZE = 360;

export const FRACTAL_ZOOMER_DEFAULTS = {
  setType: "mandelbrot",
  zoom: 1.6,
  centerX: -0.72,
  centerY: 0,
  iterations: 140,
  paletteSpeed: 0.18,
  audioReact: 0.55
} as const;

const SET_TYPE_MODES = {
  mandelbrot: "mandelbrot",
  julia: "julia",
  burningShip: "burningShip"
} as const;

export type FractalZoomerSetType = keyof typeof SET_TYPE_MODES;

export type FractalZoomerParams = {
  setType: FractalZoomerSetType;
  zoom: number;
  centerX: number;
  centerY: number;
  iterations: number;
  paletteSpeed: number;
  audioReact: number;
};

export type FractalZoomerState = {
  setType: FractalZoomerSetType;
  escapeRadiusSq: number;
  zoomScale: number;
  centerX: number;
  centerY: number;
  iterations: number;
  palettePhase: number;
  juliaCx: number;
  juliaCy: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveSetType = (value: unknown): FractalZoomerSetType => {
  if (value === "julia" || value === "burningShip") {
    return value;
  }
  return "mandelbrot";
};

export const normalizeFractalZoomerParams = (params: Record<string, unknown>): FractalZoomerParams => ({
  setType: resolveSetType(params.setType),
  zoom: clamp(toFiniteNumber(params.zoom, FRACTAL_ZOOMER_DEFAULTS.zoom), 0.4, 8),
  centerX: clamp(toFiniteNumber(params.centerX, FRACTAL_ZOOMER_DEFAULTS.centerX), -2.5, 1.5),
  centerY: clamp(toFiniteNumber(params.centerY, FRACTAL_ZOOMER_DEFAULTS.centerY), -1.8, 1.8),
  iterations: clamp(Math.round(toFiniteNumber(params.iterations, FRACTAL_ZOOMER_DEFAULTS.iterations)), 24, 600),
  paletteSpeed: clamp(toFiniteNumber(params.paletteSpeed, FRACTAL_ZOOMER_DEFAULTS.paletteSpeed), 0, 2),
  audioReact: clamp(toFiniteNumber(params.audioReact, FRACTAL_ZOOMER_DEFAULTS.audioReact), 0, 1)
});

export const buildFractalZoomerState = (
  time: number,
  audio: EffectRenderContext["audio"],
  params: FractalZoomerParams
): FractalZoomerState => {
  const beatPulse = audio.beat ? clamp(audio.beatStrength, 0, 1) : 0;
  const audioBoost = (clamp(audio.bass, 0, 1) * 0.7 + clamp(audio.rms, 0, 1) * 0.3) * params.audioReact;
  const zoomScale = Math.pow(2, params.zoom + audioBoost * 0.75 + beatPulse * 0.2);
  const palettePhase = time * params.paletteSpeed + audioBoost * 0.8;

  return {
    setType: params.setType,
    escapeRadiusSq: 4,
    zoomScale,
    centerX: params.centerX,
    centerY: params.centerY,
    iterations: Math.round(params.iterations * (1 + audioBoost * 0.35)),
    palettePhase,
    juliaCx: -0.8 + Math.sin(time * 0.31) * 0.18,
    juliaCy: 0.156 + Math.cos(time * 0.23) * 0.22
  };
};

const paletteColor = (t: number): [number, number, number] => {
  const angle = t * Math.PI * 2;
  const r = Math.round((0.5 + 0.5 * Math.cos(angle + 0.2)) * 255);
  const g = Math.round((0.5 + 0.5 * Math.cos(angle + 2.0)) * 255);
  const b = Math.round((0.5 + 0.5 * Math.cos(angle + 4.2)) * 255);
  return [r, g, b];
};

export class FractalZoomerEffect implements Effect {
  private fractalCanvas?: HTMLCanvasElement;
  private fractalCtx?: CanvasRenderingContext2D | null;
  private imageData?: ImageData;
  private imageDataData?: Uint8ClampedArray;
  private bufferW = 0;
  private bufferH = 0;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const normalized = normalizeFractalZoomerParams(params as Record<string, unknown>);
    const state = buildFractalZoomerState(time, audio, normalized);
    this.ensureBuffer(width, height);

    if (!this.fractalCanvas || !this.fractalCtx || !this.imageData || !this.imageDataData) {
      return;
    }

    const data = this.imageDataData;
    const pixelCount = this.bufferW * this.bufferH;
    const aspect = this.bufferW / this.bufferH;

    for (let i = 0; i < pixelCount; i += 1) {
      const x = i % this.bufferW;
      const y = Math.floor(i / this.bufferW);
      const uvx = (x / this.bufferW) * 2 - 1;
      const uvy = (y / this.bufferH) * 2 - 1;

      let zx = uvx * aspect / state.zoomScale + state.centerX;
      let zy = uvy / state.zoomScale + state.centerY;
      let cx = zx;
      let cy = zy;

      if (state.setType === "julia") {
        cx = state.juliaCx;
        cy = state.juliaCy;
      }

      let iter = 0;
      while (iter < state.iterations) {
        const zxSq = zx * zx;
        const zySq = zy * zy;
        if (zxSq + zySq > state.escapeRadiusSq) {
          break;
        }
        if (state.setType === "burningShip") {
          const nextX = zxSq - zySq + cx;
          const nextY = Math.abs(2 * zx * zy) + cy;
          zx = Math.abs(nextX);
          zy = Math.abs(nextY);
        } else {
          const nextX = zxSq - zySq + cx;
          const nextY = 2 * zx * zy + cy;
          zx = nextX;
          zy = nextY;
        }
        iter += 1;
      }

      const dataIndex = i * 4;
      if (iter >= state.iterations) {
        data[dataIndex] = 0;
        data[dataIndex + 1] = 0;
        data[dataIndex + 2] = 0;
        data[dataIndex + 3] = 255;
        continue;
      }

      const smoothIter = iter + 1 - Math.log2(Math.log2(Math.max(zx * zx + zy * zy, 1.00001)));
      const colorT = smoothIter / state.iterations + state.palettePhase;
      const [r, g, b] = paletteColor(colorT);
      data[dataIndex] = r;
      data[dataIndex + 1] = g;
      data[dataIndex + 2] = b;
      data[dataIndex + 3] = 255;
    }

    this.fractalCtx.putImageData(this.imageData, 0, 0);

    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.fractalCanvas, 0, 0, this.bufferW, this.bufferH, 0, 0, width, height);
    ctx.imageSmoothingEnabled = previousSmoothing;
  }

  private ensureBuffer(width: number, height: number): void {
    const nextWidth = clamp(Math.round(width * RESOLUTION_SCALE), MIN_INTERNAL_SIZE, MAX_INTERNAL_SIZE);
    const nextHeight = clamp(Math.round(height * RESOLUTION_SCALE), MIN_INTERNAL_SIZE, MAX_INTERNAL_SIZE);

    if (
      this.fractalCanvas &&
      this.bufferW === nextWidth &&
      this.bufferH === nextHeight &&
      this.imageDataData
    ) {
      return;
    }

    this.bufferW = nextWidth;
    this.bufferH = nextHeight;
    this.fractalCanvas = document.createElement("canvas");
    this.fractalCanvas.width = this.bufferW;
    this.fractalCanvas.height = this.bufferH;
    this.fractalCtx = this.fractalCanvas.getContext("2d", { alpha: false });
    if (!this.fractalCtx) {
      this.imageData = undefined;
      this.imageDataData = undefined;
      return;
    }
    this.imageData = this.fractalCtx.createImageData(this.bufferW, this.bufferH);
    this.imageDataData = this.imageData.data;
  }
}
