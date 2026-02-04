import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const TEXTURE_SIZE = 256;
const TWO_PI = Math.PI * 2;

const DEFAULTS = {
  bufW: 240,
  bufH: 150,
  speed: 1.0,
  angScroll: 30.0,
  depthScroll: 55.0,
  invRScale: 512,
  wobbleAmp: 0.8,
  wobbleAng: 6.0,
  wobbleDepth: 10.0,
  wobbleSpeedX: 0.7,
  wobbleSpeedY: 0.9,
  lighting: 1.0,
  beatKick: 0.7,
  audioReact: 0.7,
  scanlines: 0
};

const FONT_5X7: Record<string, string[]> = {
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"]
};

const clampByte = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));

const mulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const buildTunnelLuts = (bufW: number, bufH: number, invRScale: number) => {
  const angLUT = new Uint8Array(bufW * bufH);
  const invRLUT = new Uint8Array(bufW * bufH);
  const cx = bufW / 2;
  const cy = bufH / 2;
  let idx = 0;

  for (let y = 0; y < bufH; y += 1) {
    const dy = y - cy;
    for (let x = 0; x < bufW; x += 1) {
      const dx = x - cx;
      const angle = Math.atan2(dy, dx);
      const ang = Math.floor(((angle + Math.PI) / TWO_PI) * 256) & 255;
      const r = Math.sqrt(dx * dx + dy * dy);
      const invR = Math.min(255, Math.floor(invRScale / Math.max(r, 1)));
      angLUT[idx] = ang;
      invRLUT[idx] = invR;
      idx += 1;
    }
  }

  return { angLUT, invRLUT };
};

const stampText = (
  texRGB: Uint8ClampedArray,
  text: string,
  startX: number,
  startY: number,
  scale: number,
  color: [number, number, number]
): void => {
  let cursorX = startX;
  const [r, g, b] = color;

  for (const char of text) {
    if (char === " ") {
      cursorX += 6 * scale;
      continue;
    }
    const glyph = FONT_5X7[char];
    if (!glyph) {
      cursorX += 6 * scale;
      continue;
    }

    for (let y = 0; y < glyph.length; y += 1) {
      const row = glyph[y];
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] !== "1") {
          continue;
        }
        const baseX = cursorX + x * scale;
        const baseY = startY + y * scale;
        for (let sy = 0; sy < scale; sy += 1) {
          const py = baseY + sy;
          if (py < 0 || py >= TEXTURE_SIZE) {
            continue;
          }
          for (let sx = 0; sx < scale; sx += 1) {
            const px = baseX + sx;
            if (px < 0 || px >= TEXTURE_SIZE) {
              continue;
            }
            const texIdx = (py * TEXTURE_SIZE + px) * 3;
            texRGB[texIdx] = r;
            texRGB[texIdx + 1] = g;
            texRGB[texIdx + 2] = b;
          }
        }
      }
    }

    cursorX += (glyph[0]?.length ?? 5) * scale + scale;
  }
};

export const buildTunnelTexture = (seed = 0): Uint8ClampedArray => {
  const texRGB = new Uint8ClampedArray(TEXTURE_SIZE * TEXTURE_SIZE * 3);
  const rand = mulberry32(seed || 1);
  const checkerOffset = Math.floor(rand() * 32);
  const stripeOffset = Math.floor(rand() * 64);
  const ringOffset = Math.floor(rand() * 24);
  const ringScale = 7 + Math.floor(rand() * 4);
  const centerX = TEXTURE_SIZE / 2;
  const centerY = TEXTURE_SIZE / 2;

  let idx = 0;
  for (let y = 0; y < TEXTURE_SIZE; y += 1) {
    const dy = y - centerY + seed * 0.1;
    for (let x = 0; x < TEXTURE_SIZE; x += 1) {
      const dx = x - centerX + seed * 0.1;
      const checker = (((x + checkerOffset) >> 4) ^ ((y + checkerOffset) >> 4)) & 1;
      const diag = (((x + y + stripeOffset) >> 3) & 1) ? 1 : -1;
      const diag2 = (((x - y + stripeOffset) >> 4) & 1) ? 1 : -1;
      const rDist = Math.sqrt(dx * dx + dy * dy);
      const ring = (Math.floor((rDist + ringOffset) / ringScale) & 1) ? 1 : -1;

      const base = 70 + checker * 110 + ring * 30 + diag * 20;
      const r = clampByte(base + diag2 * 40);
      const g = clampByte(base - 20 + ring * 30);
      const b = clampByte(base + diag * -30 + diag2 * 20);

      texRGB[idx] = r;
      texRGB[idx + 1] = g;
      texRGB[idx + 2] = b;
      idx += 3;
    }
  }

  stampText(texRGB, "TUNNEL", 52, 116, 3, [255, 230, 140]);
  stampText(texRGB, "TUNNEL", 60, 40, 2, [90, 200, 255]);

  return texRGB;
};

export const computeTunnelLight = (near: number, beatPulse: number, lighting: number): number => {
  const core = 0.25 + 1.15 * Math.pow(near, 1.2);
  const rim = 0.35 + 0.9 * Math.pow(near, 2.1);
  const pulse = 1 + 0.35 * beatPulse;
  return core * rim * pulse * lighting;
};

export class TextureTunnelEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private data: Uint8ClampedArray | null = null;
  private angLUT: Uint8Array | null = null;
  private invRLUT: Uint8Array | null = null;
  private texRGB: Uint8ClampedArray | null = null;
  private rowWobble: Float32Array | null = null;
  private colWobble: Float32Array | null = null;
  private bufW = 0;
  private bufH = 0;
  private invRScale = 0;
  private seed = 0;
  private lastTime = 0;
  private beatPulse = 0;

  private ensureBuffers(bufW: number, bufH: number, invRScale: number, seed: number): void {
    const needsResize = bufW !== this.bufW || bufH !== this.bufH;
    if (!this.bufferCanvas) {
      this.bufferCanvas = document.createElement("canvas");
    }
    if (!this.bufferCtx) {
      const ctx = this.bufferCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Unable to create texture tunnel buffer context");
      }
      this.bufferCtx = ctx;
    }

    if (needsResize) {
      this.bufferCanvas.width = bufW;
      this.bufferCanvas.height = bufH;
      this.imageData = this.bufferCtx.createImageData(bufW, bufH);
      this.data = this.imageData.data;
      this.rowWobble = new Float32Array(bufH);
      this.colWobble = new Float32Array(bufW);
      this.bufW = bufW;
      this.bufH = bufH;
    }

    if (needsResize || invRScale !== this.invRScale) {
      const luts = buildTunnelLuts(bufW, bufH, invRScale);
      this.angLUT = luts.angLUT;
      this.invRLUT = luts.invRLUT;
      this.invRScale = invRScale;
    }

    if (!this.texRGB || seed !== this.seed) {
      this.texRGB = buildTunnelTexture(seed);
      this.seed = seed;
    }
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const bufW = Math.max(64, Math.floor(params.bufW ?? DEFAULTS.bufW));
    const bufH = Math.max(64, Math.floor(params.bufH ?? DEFAULTS.bufH));
    const speed = params.speed ?? DEFAULTS.speed;
    const angScroll = params.angScroll ?? DEFAULTS.angScroll;
    const depthScroll = params.depthScroll ?? DEFAULTS.depthScroll;
    const invRScale = Math.max(1, Math.floor(params.invRScale ?? DEFAULTS.invRScale));
    const wobbleAmp = clamp(params.wobbleAmp ?? DEFAULTS.wobbleAmp, 0, 2);
    const wobbleAng = params.wobbleAng ?? DEFAULTS.wobbleAng;
    const wobbleDepth = params.wobbleDepth ?? DEFAULTS.wobbleDepth;
    const wobbleSpeedX = params.wobbleSpeedX ?? DEFAULTS.wobbleSpeedX;
    const wobbleSpeedY = params.wobbleSpeedY ?? DEFAULTS.wobbleSpeedY;
    const lighting = clamp(params.lighting ?? DEFAULTS.lighting, 0, 1);
    const beatKick = clamp(params.beatKick ?? DEFAULTS.beatKick, 0, 1);
    const audioReact = clamp(params.audioReact ?? DEFAULTS.audioReact, 0, 1);
    const scanlines = clamp(params.scanlines ?? DEFAULTS.scanlines, 0, 1);
    const seed = Math.floor(params.seed ?? 0);

    this.ensureBuffers(bufW, bufH, invRScale, seed);

    const dt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;
    if (audio.beat) {
      this.beatPulse = 1;
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 6);

    const beatPulse = this.beatPulse;
    const speedEff = speed * (1 + 0.4 * audio.bass * audioReact + 0.6 * beatPulse * beatKick);
    const angTime = time * angScroll * speedEff;
    const depthTime = time * depthScroll * speedEff;
    const twist = Math.sin(time * 0.6) * 18 * wobbleAmp;
    const roll = Math.sin(time * 0.9) * 6 * wobbleAmp;

    const rowWobble = this.rowWobble as Float32Array;
    const colWobble = this.colWobble as Float32Array;

    for (let y = 0; y < bufH; y += 1) {
      const wave = Math.sin(time * 2 * wobbleSpeedY + y * 0.05);
      rowWobble[y] = wave * wobbleAng * wobbleAmp + twist * Math.sin(y * 0.03);
    }
    for (let x = 0; x < bufW; x += 1) {
      const wave = Math.sin(time * 1.3 * wobbleSpeedX + x * 0.04);
      colWobble[x] = wave * wobbleDepth * wobbleAmp + roll * Math.cos(x * 0.02);
    }

    const data = this.data as Uint8ClampedArray;
    const angLUT = this.angLUT as Uint8Array;
    const invRLUT = this.invRLUT as Uint8Array;
    const texRGB = this.texRGB as Uint8ClampedArray;

    let idx = 0;
    for (let y = 0; y < bufH; y += 1) {
      const wobbleU = rowWobble[y];
      for (let x = 0; x < bufW; x += 1) {
        const ang = angLUT[idx];
        const invR = invRLUT[idx];
        const u = (ang + angTime + wobbleU + roll * (x - bufW / 2) * 0.02) & 255;
        const v = (invR + depthTime + colWobble[x] + twist * (y - bufH / 2) * 0.02) & 255;
        const texIdx = (v * TEXTURE_SIZE + u) * 3;

        const near = invR / 255;
        let light = computeTunnelLight(near, beatPulse, lighting);
        const sparkle = 0.92 + 0.08 * Math.sin((u + v) * 0.22 + time * 2.2);
        light *= sparkle;

        const outIdx = idx * 4;
        data[outIdx] = clampByte(texRGB[texIdx] * light * (1.05 - near * 0.15));
        data[outIdx + 1] = clampByte(texRGB[texIdx + 1] * light);
        data[outIdx + 2] = clampByte(texRGB[texIdx + 2] * light * (0.95 + near * 0.2));
        data[outIdx + 3] = 255;
        idx += 1;
      }
    }

    const bufferCtx = this.bufferCtx as CanvasRenderingContext2D;
    const imageData = this.imageData as ImageData;
    bufferCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bufferCanvas as HTMLCanvasElement, 0, 0, bufW, bufH, 0, 0, width, height);

    if (lighting > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.25 + beatPulse * 0.2;
      ctx.fillStyle = "rgba(180, 210, 255, 0.7)";
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.14, 0, TWO_PI);
      ctx.fill();
      ctx.restore();
    }

    if (scanlines > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 * scanlines;
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.restore();
    }
  }

  reset(): void {
    this.lastTime = 0;
    this.beatPulse = 0;
  }
}
