import { Effect, EffectRenderContext } from "./types";
import { H, W, applyExplicit_frameBytes } from "../../generated/explicitPixelsFrame";

const EXPLICIT_PIXELS_DEFAULTS = {
  mode: "explicit",
  speed: 1,
  audioReact: 0.7
} as const;

function getAudioValue(audio: EffectRenderContext["audio"]): number {
  return audio.beatStrength || audio.bass || audio.rms || audio.energy || 0;
}

export class ExplicitPixelsEffect implements Effect {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = W;
    this.canvas.height = H;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to create explicitPixels buffer");
    }
    this.ctx = ctx;
    this.imageData = ctx.createImageData(W, H);
    applyExplicit_frameBytes(this.imageData.data);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const mode = ((params as Record<string, number | string>).mode ?? EXPLICIT_PIXELS_DEFAULTS.mode).toString();
    const data = this.imageData.data;

    if (mode === "procedural") {
      this.renderProcedural(data, time, audio, params);
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.canvas, 0, 0, width, height);
    ctx.restore();
  }

  private renderProcedural(
    data: Uint8ClampedArray,
    time: number,
    audio: EffectRenderContext["audio"],
    params: EffectRenderContext["params"]
  ): void {
    const speed = params.speed ?? EXPLICIT_PIXELS_DEFAULTS.speed;
    const audioReact = params.audioReact ?? EXPLICIT_PIXELS_DEFAULTS.audioReact;
    const pulse = getAudioValue(audio) * audioReact;
    const t = time * (0.9 + speed * 0.65);

    for (let y = 0; y < H; y += 1) {
      const ny = (y / H) * 2 - 1;
      for (let x = 0; x < W; x += 1) {
        const nx = (x / W) * 2 - 1;
        const idx = (y * W + x) * 4;
        const ring = Math.sin(12 * Math.hypot(nx * 1.2, ny * 1.7) - t * 2.8);
        const plasma = Math.sin((nx * 8 + t * 1.6)) + Math.cos((ny * 10 - t * 1.25));
        const heat = 0.5 + 0.5 * Math.sin(plasma + ring + t * 0.7);
        const beat = 0.6 + pulse * 0.8;

        data[idx] = Math.min(255, 35 + heat * 180 * beat + Math.max(0, ring) * 40);
        data[idx + 1] = Math.min(255, 14 + heat * 100 * beat + Math.max(0, plasma) * 18);
        data[idx + 2] = Math.min(255, 45 + heat * 220 * beat + Math.max(0, -ring) * 55);
        data[idx + 3] = 255;
      }
    }
  }
}
