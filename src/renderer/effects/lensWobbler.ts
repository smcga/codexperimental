import { Effect, EffectRenderContext } from "./types";
import { clamp, smoothstep } from "../../util/math";

const TEX_SIZE = 256;
const DEFAULT_BUF_W = 240;
const DEFAULT_BUF_H = 150;
const TEXT_STAMP = {
  text: "VGA WARP",
  x: 18,
  y: 24,
  scale: 2
};

const FONT_5X7: Record<string, number[]> = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  " ": [0, 0, 0, 0, 0, 0, 0]
};

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

const resolveStringParam = (value: unknown, fallback: string): string =>
  typeof value === "string" ? value : fallback;

const createRng = (seed: number): (() => number) => {
  let state = (seed * 1664525 + 1013904223) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state & 0xfffffff) / 0xfffffff;
  };
};

const stampText = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  text: string,
  startX: number,
  startY: number,
  scale: number
): void => {
  const upper = text.toUpperCase();
  let cursorX = startX;

  for (const char of upper) {
    const glyph = FONT_5X7[char] ?? FONT_5X7[" "];
    for (let row = 0; row < glyph.length; row += 1) {
      const rowBits = glyph[row];
      for (let col = 0; col < 5; col += 1) {
        if ((rowBits >> (4 - col)) & 1) {
          for (let sy = 0; sy < scale; sy += 1) {
            const py = startY + row * scale + sy;
            if (py < 0 || py >= height) {
              continue;
            }
            for (let sx = 0; sx < scale; sx += 1) {
              const px = cursorX + col * scale + sx;
              if (px < 0 || px >= width) {
                continue;
              }
              const idx = (py * width + px) * 3;
              data[idx] = 246;
              data[idx + 1] = 228;
              data[idx + 2] = 120;
            }
          }
        }
      }
    }
    cursorX += 6 * scale;
  }
};

export const createLensTexture = (seed = 0): { data: Uint8ClampedArray; width: number; height: number } => {
  const data = new Uint8ClampedArray(TEX_SIZE * TEX_SIZE * 3);
  const rng = createRng(seed);
  const cx = TEX_SIZE / 2;
  const cy = TEX_SIZE / 2;

  for (let y = 0; y < TEX_SIZE; y += 1) {
    for (let x = 0; x < TEX_SIZE; x += 1) {
      const idx = (y * TEX_SIZE + x) * 3;
      const checker = ((x >> 4) ^ (y >> 4)) & 1;
      const stripe = ((x + y) >> 3) & 1;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / (TEX_SIZE * 0.5);
      const radial = clamp(1 - dist, 0, 1);
      const noise = (rng() - 0.5) * 14;

      let base = 40 + checker * 38 + stripe * 26 + radial * 70 + noise;
      base = clamp(base, 0, 255);

      const r = clamp(base + checker * 18, 0, 255);
      const g = clamp(base + stripe * 32, 0, 255);
      const b = clamp(base + (checker ? 12 : 42), 0, 255);

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
    }
  }

  stampText(data, TEX_SIZE, TEX_SIZE, TEXT_STAMP.text, TEXT_STAMP.x, TEXT_STAMP.y, TEXT_STAMP.scale);

  return { data, width: TEX_SIZE, height: TEX_SIZE };
};

export class LensWobblerEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private wobbleCanvas: HTMLCanvasElement | null = null;
  private wobbleCtx: CanvasRenderingContext2D | null = null;
  private texData: Uint8ClampedArray | null = null;
  private texSeed = Number.NaN;
  private beatPulse = 0;
  private bufW = 0;
  private bufH = 0;

  private ensureBuffers(width: number, height: number): void {
    if (!this.bufferCanvas || this.bufW !== width || this.bufH !== height) {
      this.bufferCanvas = document.createElement("canvas");
      this.bufferCanvas.width = width;
      this.bufferCanvas.height = height;
      const ctx = this.bufferCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create lens buffer context");
      }
      ctx.imageSmoothingEnabled = false;
      this.bufferCtx = ctx;
      this.imageData = ctx.createImageData(width, height);
      this.bufW = width;
      this.bufH = height;
    }

    if (!this.wobbleCanvas || this.wobbleCanvas.width !== width || this.wobbleCanvas.height !== height) {
      this.wobbleCanvas = document.createElement("canvas");
      this.wobbleCanvas.width = width;
      this.wobbleCanvas.height = height;
      const wobbleCtx = this.wobbleCanvas.getContext("2d");
      if (!wobbleCtx) {
        throw new Error("Unable to create wobble buffer context");
      }
      wobbleCtx.imageSmoothingEnabled = false;
      this.wobbleCtx = wobbleCtx;
    }
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const bufW = clamp(Math.round(resolveNumberParam(rawParams.bufW, DEFAULT_BUF_W)), 120, 480);
    const bufH = clamp(Math.round(resolveNumberParam(rawParams.bufH, DEFAULT_BUF_H)), 90, 360);
    const rotSpeed = resolveNumberParam(rawParams.rotSpeed, 0.25);
    const baseScale = resolveNumberParam(rawParams.baseScale, 0.9);
    const zoomAmp = resolveNumberParam(rawParams.zoomAmp, 0.15);
    const zoomSpeed = resolveNumberParam(rawParams.zoomSpeed, 0.6);
    const scrollU = resolveNumberParam(rawParams.scrollU, 30);
    const scrollV = resolveNumberParam(rawParams.scrollV, 18);
    const lensStrengthBase = resolveNumberParam(rawParams.lensStrength, 0.75);
    const lensRadiusBase = resolveNumberParam(rawParams.lensRadius, Math.min(bufW, bufH) * 0.22);
    const invertRing = resolveBooleanParam(rawParams.invertRing, true);
    const wobbleEnabled = resolveBooleanParam(rawParams.wobble, true);
    const wobbleAmpBase = resolveNumberParam(rawParams.wobbleAmp, 6);
    const wobbleFreq = resolveNumberParam(rawParams.wobbleFreq, 0.1);
    const wobbleSpeed = resolveNumberParam(rawParams.wobbleSpeed, 3.0);
    const wobbleSlice = clamp(Math.round(resolveNumberParam(rawParams.wobbleSlice, 2)), 1, 8);
    const audioReact = clamp(resolveNumberParam(rawParams.audioReact, 0.7), 0, 1);
    const beatKick = clamp(resolveNumberParam(rawParams.beatKick, 0.7), 0, 1);
    const seed = resolveNumberParam(rawParams.seed, 0);
    const lensPath = resolveStringParam(rawParams.lensPath, "circle");

    this.ensureBuffers(bufW, bufH);

    if (!this.texData || this.texSeed !== seed) {
      const texture = createLensTexture(seed);
      this.texData = texture.data;
      this.texSeed = seed;
    }

    if (audio.beat) {
      this.beatPulse = 1;
    }
    this.beatPulse = clamp(this.beatPulse - delta * 6, 0, 1);

    const bassBoost = audio.bass * audioReact;
    const beatBoost = beatKick * this.beatPulse;
    const lensStrength = lensStrengthBase * (1 + bassBoost * 0.35 + beatBoost * 0.35);
    const lensRadius = lensRadiusBase * (1 + beatBoost * 0.18);
    const wobbleAmp = wobbleAmpBase * (1 + bassBoost * 0.25 + beatBoost * 0.35);

    const cx = bufW / 2;
    const cy = bufH / 2;
    let lensX = cx + Math.sin(time * 0.7) * cx * 0.6;
    let lensY = cy + Math.cos(time * 0.9) * cy * 0.45;
    if (lensPath === "lissajous") {
      lensX = cx + Math.sin(time * 0.83) * cx * 0.55;
      lensY = cy + Math.sin(time * 1.21 + 1.4) * cy * 0.48;
    }

    const angle = time * rotSpeed;
    const scale = baseScale + zoomAmp * Math.sin(time * zoomSpeed);
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const u0 = time * scrollU;
    const v0 = time * scrollV;
    const lensR2 = lensRadius * lensRadius;

    const imageData = this.imageData;
    const bufferCtx = this.bufferCtx;
    const texData = this.texData;

    if (!imageData || !bufferCtx || !texData) {
      return;
    }

    const data = imageData.data;

    for (let y = 0; y < bufH; y += 1) {
      for (let x = 0; x < bufW; x += 1) {
        const idx = (y * bufW + x) * 4;
        let sampleX = x;
        let sampleY = y;
        const dx = x - lensX;
        const dy = y - lensY;
        const r2 = dx * dx + dy * dy;

        if (r2 < lensR2) {
          const r = Math.sqrt(r2);
          const rn = Math.max(r / lensRadius, 1e-6);
          const bulge = 1 - rn * rn;
          const factor = 1 + lensStrength * bulge;
          sampleX = lensX + dx / factor;
          sampleY = lensY + dy / factor;

          if (invertRing) {
            const ring = smoothstep(0.78, 0.98, rn) - smoothstep(0.98, 1.0, rn);
            sampleX += dx * ring * 0.08;
            sampleY += dy * ring * 0.08;
          }
        }

        const relX = sampleX - cx;
        const relY = sampleY - cy;
        const u = (cosA * relX - sinA * relY) * scale + u0;
        const v = (sinA * relX + cosA * relY) * scale + v0;
        const tu = (Math.floor(u) & 255) * 3;
        const tv = Math.floor(v) & 255;
        const tIdx = tv * TEX_SIZE * 3 + tu;

        data[idx] = texData[tIdx];
        data[idx + 1] = texData[tIdx + 1];
        data[idx + 2] = texData[tIdx + 2];
        data[idx + 3] = 255;
      }
    }

    bufferCtx.putImageData(imageData, 0, 0);

    let finalCanvas = this.bufferCanvas as HTMLCanvasElement;

    if (wobbleEnabled && this.wobbleCanvas && this.wobbleCtx) {
      const wobbleCtx = this.wobbleCtx;
      wobbleCtx.clearRect(0, 0, bufW, bufH);
      for (let y = 0; y < bufH; y += wobbleSlice) {
        const offset = Math.sin(time * wobbleSpeed + y * wobbleFreq) * wobbleAmp;
        wobbleCtx.drawImage(this.bufferCanvas as HTMLCanvasElement, 0, y, bufW, wobbleSlice, offset, y, bufW, wobbleSlice);
      }
      finalCanvas = this.wobbleCanvas;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(finalCanvas, 0, 0, bufW, bufH, 0, 0, width, height);

    const scaleX = width / bufW;
    const scaleY = height / bufH;
    ctx.globalCompositeOperation = "screen";
    ctx.beginPath();
    ctx.strokeStyle = `rgba(210, 240, 255, ${0.12 + beatBoost * 0.22})`;
    ctx.lineWidth = Math.max(1, 2 * Math.min(scaleX, scaleY));
    ctx.arc(lensX * scaleX, lensY * scaleY, lensRadius * Math.min(scaleX, scaleY), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export { TEXT_STAMP };
