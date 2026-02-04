import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const DEFAULT_FIRE_W = 160;
const DEFAULT_FIRE_H = 120;
const DEFAULT_STEPS = 1;
const DEFAULT_BASE_HEAT = 160;
const DEFAULT_SPARK_CHANCE = 0.55;
const DEFAULT_DECAY = 3;
const DEFAULT_WIND = 0;
const DEFAULT_WIND_WAVE = 0.6;
const DEFAULT_TURBULENCE = 1.2;
const DEFAULT_GUST = 0.8;
const DEFAULT_AUDIO_REACT = 0.7;
const DEFAULT_LOGO_SIZE = 48;
const DEFAULT_GUST_DURATION = 0.28;

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const resolveStringParam = (value: unknown, fallback?: string): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  return fallback;
};

const wrapIndex = (value: number, size: number): number => {
  const wrapped = value % size;
  return wrapped < 0 ? wrapped + size : wrapped;
};

export const buildVgaFirePalette = (): Uint8Array => {
  const palette = new Uint8Array(256 * 3);
  for (let i = 0; i < 64; i += 1) {
    const t = i / 63;
    const r = Math.round(128 * t);
    palette[i * 3] = r;
    palette[i * 3 + 1] = 0;
    palette[i * 3 + 2] = 0;
  }
  for (let i = 64; i < 128; i += 1) {
    const t = (i - 64) / 63;
    const r = Math.round(128 + 127 * t);
    const g = Math.round(64 * t);
    palette[i * 3] = r;
    palette[i * 3 + 1] = g;
    palette[i * 3 + 2] = 0;
  }
  for (let i = 128; i < 192; i += 1) {
    const t = (i - 128) / 63;
    const g = Math.round(64 + 191 * t);
    palette[i * 3] = 255;
    palette[i * 3 + 1] = g;
    palette[i * 3 + 2] = 0;
  }
  for (let i = 192; i < 256; i += 1) {
    const t = (i - 192) / 63;
    const b = Math.round(255 * t);
    palette[i * 3] = 255;
    palette[i * 3 + 1] = 255;
    palette[i * 3 + 2] = b;
  }
  return palette;
};

export class VgaFireEffect implements Effect {
  private fireW = 0;
  private fireH = 0;
  private heat: Uint8Array = new Uint8Array(0);
  private heatNext: Uint8Array = new Uint8Array(0);
  private palette: Uint8Array = buildVgaFirePalette();
  private fireCanvas?: HTMLCanvasElement;
  private fireCtx?: CanvasRenderingContext2D | null;
  private imageData?: ImageData;
  private imageDataData?: Uint8ClampedArray;
  private lastBeatTime = -Infinity;
  private logoMask?: Uint8Array;
  private logoKey = "";
  private logoCanvas?: HTMLCanvasElement;
  private logoCtx?: CanvasRenderingContext2D | null;

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const fireW = Math.floor(clamp(resolveNumberParam(rawParams.fireW, DEFAULT_FIRE_W), 40, 400));
    const fireH = Math.floor(clamp(resolveNumberParam(rawParams.fireH, DEFAULT_FIRE_H), 40, 300));
    const stepsPerFrame = Math.floor(
      clamp(resolveNumberParam(rawParams.stepsPerFrame, DEFAULT_STEPS), 1, 4)
    );
    const baseHeat = clamp(resolveNumberParam(rawParams.baseHeat, DEFAULT_BASE_HEAT), 0, 255);
    const sparkChance = clamp(
      resolveNumberParam(rawParams.sparkChance, DEFAULT_SPARK_CHANCE),
      0,
      1
    );
    const decay = clamp(resolveNumberParam(rawParams.decay, DEFAULT_DECAY), 1, 8);
    const wind = clamp(resolveNumberParam(rawParams.wind, DEFAULT_WIND), -1, 1);
    const windWave = clamp(resolveNumberParam(rawParams.windWave, DEFAULT_WIND_WAVE), 0, 2);
    const turbulence = clamp(resolveNumberParam(rawParams.turbulence, DEFAULT_TURBULENCE), 0, 3);
    const gustOnBeat = clamp(resolveNumberParam(rawParams.gustOnBeat, DEFAULT_GUST), 0, 1);
    const audioReact = clamp(
      resolveNumberParam(rawParams.audioReact, DEFAULT_AUDIO_REACT),
      0,
      1
    );
    const logoText = resolveStringParam(rawParams.logoText);
    const logoSize = clamp(resolveNumberParam(rawParams.logoSize, DEFAULT_LOGO_SIZE), 10, 160);
    const logoY = clamp(
      resolveNumberParam(rawParams.logoY, fireH * 0.65),
      0,
      fireH - 1
    );
    const scanlines = resolveBooleanParam(rawParams.scanlines, false);
    const glowStrength = clamp(resolveNumberParam(rawParams.glowStrength, 0), 0, 1);

    this.ensureBuffers(fireW, fireH);

    if (audio.beat) {
      this.lastBeatTime = time;
    }

    const beatPulse = clamp(
      1 - (time - this.lastBeatTime) / DEFAULT_GUST_DURATION,
      0,
      1
    );
    const gustStrength = beatPulse * gustOnBeat;
    const audioBoost = audio.bass * audioReact;

    const baseHeatBoost = clamp(baseHeat + audioBoost * 90 + gustStrength * 50, 0, 255);
    const sparkChanceBoost = clamp(sparkChance + audioBoost * 0.2 + gustStrength * 0.25, 0, 1);
    const decayBoost = clamp(decay - gustStrength * 2 - audioBoost * 1.2, 1, 8);

    const windEff =
      wind +
      Math.sin((time + audioBoost) * 0.7) * windWave +
      gustStrength * 0.8;
    const turbulenceEff = clamp(turbulence + gustStrength * 1.2 + audioBoost * 0.6, 0, 4);

    let heat = this.heat;
    let heatNext = this.heatNext;
    const fireStride = this.fireW;
    const fireHeight = this.fireH;
    const bottomRow = fireStride * (fireHeight - 1);
    const secondBottomRow = fireStride * (fireHeight - 2);

    for (let step = 0; step < stepsPerFrame; step += 1) {
      for (let x = 0; x < fireStride; x += 1) {
        const spark = Math.random() < sparkChanceBoost ? 255 : Math.floor(Math.random() * baseHeatBoost);
        heat[bottomRow + x] = spark;
        if (fireHeight > 1) {
          heat[secondBottomRow + x] = Math.floor(spark * 0.7);
        }
      }

      heatNext.fill(0);

      for (let y = 0; y < fireHeight - 1; y += 1) {
        const row = y * fireStride;
        const rowBelow = (y + 1) * fireStride;
        const rowBelow2 = Math.min(y + 2, fireHeight - 1) * fireStride;
        for (let x = 0; x < fireStride; x += 1) {
          const a = heat[rowBelow + x];
          const b = heat[rowBelow + wrapIndex(x - 1, fireStride)];
          const c = heat[rowBelow + wrapIndex(x + 1, fireStride)];
          const d = heat[rowBelow2 + x];
          const avg = (a + b + c + d) >> 2;
          const cooled = Math.max(0, avg - decayBoost);
          const windOffset =
            windEff +
            (Math.random() - 0.5) * turbulenceEff +
            gustStrength * 0.6;
          const targetX = wrapIndex(Math.round(x + windOffset), fireStride);
          heatNext[row + targetX] = cooled;
        }
      }

      for (let x = 0; x < fireStride; x += 1) {
        heatNext[bottomRow + x] = heat[bottomRow + x];
      }

      const swap = heat;
      heat = heatNext;
      heatNext = swap;
    }
    this.heat = heat;
    this.heatNext = heatNext;

    const data = this.imageDataData;
    if (!data || !this.imageData || !this.fireCtx || !this.fireCanvas) {
      return;
    }

    const mask = this.ensureLogoMask(logoText, logoSize, logoY);
    const palette = this.palette;
    const currentHeat = this.heat;
    const length = currentHeat.length;
    for (let i = 0; i < length; i += 1) {
      let value = currentHeat[i];
      if (mask) {
        const maskValue = mask[i];
        if (maskValue > 0) {
          value = Math.min(255, value + Math.floor(maskValue * 0.25));
        } else {
          value = Math.floor(value * 0.6);
        }
      }
      const paletteIndex = value * 3;
      const dataIndex = i * 4;
      data[dataIndex] = palette[paletteIndex];
      data[dataIndex + 1] = palette[paletteIndex + 1];
      data[dataIndex + 2] = palette[paletteIndex + 2];
      data[dataIndex + 3] = 255;
    }

    this.fireCtx.putImageData(this.imageData, 0, 0);

    const previousSmoothing = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.fireCanvas, 0, 0, fireW, fireH, 0, 0, width, height);
    if (glowStrength > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = glowStrength;
      ctx.drawImage(this.fireCanvas, 0, 0, fireW, fireH, 0, 0, width, height);
      ctx.restore();
    }
    if (scanlines) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    }
    ctx.imageSmoothingEnabled = previousSmoothing;
  }

  reset(): void {
    this.lastBeatTime = -Infinity;
  }

  private ensureBuffers(fireW: number, fireH: number): void {
    if (this.fireW === fireW && this.fireH === fireH && this.fireCanvas && this.imageDataData) {
      return;
    }
    this.fireW = fireW;
    this.fireH = fireH;
    this.heat = new Uint8Array(fireW * fireH);
    this.heatNext = new Uint8Array(fireW * fireH);
    if (!this.fireCanvas) {
      this.fireCanvas = document.createElement("canvas");
    }
    this.fireCanvas.width = fireW;
    this.fireCanvas.height = fireH;
    this.fireCtx = this.fireCanvas.getContext("2d");
    if (!this.fireCtx) {
      return;
    }
    this.imageData = this.fireCtx.createImageData(fireW, fireH);
    this.imageDataData = this.imageData.data;
    this.logoKey = "";
    this.logoMask = undefined;
  }

  private ensureLogoMask(
    logoText: string | undefined,
    logoSize: number,
    logoY: number
  ): Uint8Array | undefined {
    if (!logoText) {
      this.logoKey = "";
      this.logoMask = undefined;
      return undefined;
    }
    if (typeof document === "undefined") {
      return undefined;
    }
    const key = `${logoText}-${logoSize}-${logoY}-${this.fireW}-${this.fireH}`;
    if (key === this.logoKey && this.logoMask) {
      return this.logoMask;
    }
    if (!this.logoCanvas) {
      this.logoCanvas = document.createElement("canvas");
    }
    this.logoCanvas.width = this.fireW;
    this.logoCanvas.height = this.fireH;
    this.logoCtx = this.logoCanvas.getContext("2d");
    if (!this.logoCtx) {
      return undefined;
    }
    this.logoCtx.clearRect(0, 0, this.fireW, this.fireH);
    this.logoCtx.fillStyle = "#ffffff";
    this.logoCtx.font = `bold ${logoSize}px sans-serif`;
    this.logoCtx.textAlign = "center";
    this.logoCtx.textBaseline = "middle";
    this.logoCtx.fillText(logoText, this.fireW / 2, logoY);
    const imageData = this.logoCtx.getImageData(0, 0, this.fireW, this.fireH);
    const mask = new Uint8Array(this.fireW * this.fireH);
    for (let i = 0; i < mask.length; i += 1) {
      mask[i] = imageData.data[i * 4 + 3];
    }
    this.logoKey = key;
    this.logoMask = mask;
    return mask;
  }
}
