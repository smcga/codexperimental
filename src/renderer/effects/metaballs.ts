import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type RGBTuple = [number, number, number];

type PaletteName = "chrome" | "neon";

const LIGHT_DIR: RGBTuple = (() => {
  const x = 0.3;
  const y = 0.4;
  const z = 1.0;
  const len = Math.hypot(x, y, z) || 1;
  return [x / len, y / len, z / len];
})();

const clamp01 = (value: number): number => clamp(value, 0, 1);

export const createSeededRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

export const hslToRgb = (hue: number, saturation: number, lightness: number, out: RGBTuple): void => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp01(saturation);
  const l = clamp01(lightness);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp >= 1 && hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp >= 2 && hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp >= 3 && hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp >= 4 && hp < 5) {
    r1 = x;
    b1 = c;
  } else if (hp >= 5 && hp < 6) {
    r1 = c;
    b1 = x;
  }

  const m = l - c / 2;
  out[0] = (r1 + m) * 255;
  out[1] = (g1 + m) * 255;
  out[2] = (b1 + m) * 255;
};

const resolvePaletteName = (params: Record<string, unknown>): PaletteName => {
  const palette = params.palette;
  if (palette === "chrome" || palette === "neon") {
    return palette;
  }
  return "chrome";
};

export class MetaballsEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private data: Uint8ClampedArray | null = null;
  private bufW = 0;
  private bufH = 0;

  private count = 0;
  private baseRadius = 0;
  private radiusVar = 0;
  private seed = 0;
  private ballRadius: Float32Array = new Float32Array(0);
  private phase: Float32Array = new Float32Array(0);
  private freqX: Float32Array = new Float32Array(0);
  private freqY: Float32Array = new Float32Array(0);
  private px: Float32Array = new Float32Array(0);
  private py: Float32Array = new Float32Array(0);

  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const bufW = Math.max(80, Math.round(params.bufW ?? 240));
    const bufH = Math.max(60, Math.round(params.bufH ?? 180));
    this.ensureBuffer(bufW, bufH);

    const count = clamp(Math.round(params.count ?? 6), 2, 12);
    const baseRadius = Math.max(6, params.baseRadius ?? 34);
    const radiusVar = Math.max(0, params.radiusVar ?? 10);
    const seed = Math.round(params.seed ?? 1);
    this.ensureBalls(count, baseRadius, radiusVar, seed);

    const baseThreshold = params.baseThreshold ?? 1.2;
    const edgeSoftness = Math.max(0.01, params.edgeSoftness ?? 0.08);
    const normalZ = Math.max(40, params.normalZ ?? 220);
    const ambient = clamp(params.ambient ?? 0.15, 0, 1);
    const diffuse = clamp(params.diffuse ?? 1.0, 0, 2);
    const specStrength = clamp(params.specStrength ?? 0.35, 0, 1.5);
    const shininess = Math.max(1, params.shininess ?? 24);
    const rimStrength = clamp(params.rimStrength ?? 0.25, 0, 1.5);
    const hueSpeed = params.hueSpeed ?? 22;
    const smoothing = params.smoothing ?? 1;
    const glow = clamp(params.glow ?? 0.25, 0, 1);
    const audioReact = clamp(params.audioReact ?? 0.7, 0, 1);
    const beatKick = clamp(params.beatKick ?? 0.7, 0, 1);

    const dt = clamp(delta ?? 0, 0, 0.05);
    if (audio?.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    const bass = audio?.bass ?? 0;
    const radiusMult = 1 + 0.25 * bass * audioReact + 0.35 * this.beatPulse * beatKick;
    const thresholdEff = baseThreshold * (1 + 0.1 * bass * audioReact - 0.12 * this.beatPulse * beatKick);
    const thresholdSoft = thresholdEff * (1 + edgeSoftness);

    const cx = bufW * 0.5;
    const cy = bufH * 0.5;
    const ampX = bufW * 0.28;
    const ampY = bufH * 0.22;
    for (let i = 0; i < count; i += 1) {
      this.px[i] = cx + Math.sin(time * this.freqX[i] + this.phase[i]) * ampX;
      this.py[i] = cy + Math.cos(time * this.freqY[i] + this.phase[i]) * ampY;
    }

    const data = this.data;
    if (!data || !this.imageData || !this.bufferCtx) {
      return;
    }

    const palette = resolvePaletteName(params as Record<string, unknown>);
    const rgb: RGBTuple = [0, 0, 0];
    const lightX = LIGHT_DIR[0];
    const lightY = LIGHT_DIR[1];
    const lightZ = LIGHT_DIR[2];

    for (let y = 0; y < bufH; y += 1) {
      const bgShade = 4 + (y / bufH) * 10;
      for (let x = 0; x < bufW; x += 1) {
        let field = 0;
        let gx = 0;
        let gy = 0;

        for (let i = 0; i < count; i += 1) {
          const dx = x - this.px[i];
          const dy = y - this.py[i];
          const d2 = dx * dx + dy * dy + 1.0;
          const r = this.ballRadius[i] * radiusMult;
          const ri2 = r * r;
          const contrib = ri2 / d2;
          field += contrib;
          const inv = ri2 / (d2 * d2);
          gx += -2 * dx * inv;
          gy += -2 * dy * inv;
        }

        const blend = smoothstep(thresholdEff, thresholdSoft, field);
        const idx = (y * bufW + x) * 4;

        if (blend <= 0) {
          data[idx] = bgShade;
          data[idx + 1] = bgShade;
          data[idx + 2] = bgShade + 2;
          data[idx + 3] = 255;
          continue;
        }

        const nz = normalZ;
        const len = Math.hypot(gx, gy, nz) || 1;
        const nx = gx / len;
        const ny = gy / len;
        const nnz = nz / len;

        const ndl = Math.max(0, nx * lightX + ny * lightY + nnz * lightZ);
        const diffuseTerm = ambient + diffuse * ndl;
        const spec = Math.pow(Math.max(0, nnz), shininess) * specStrength;
        const rim = Math.pow(1 - clamp01(nnz), 2) * rimStrength;

        if (palette === "neon") {
          const hue = (time * hueSpeed + field * 15) % 360;
          hslToRgb(hue, 0.85, 0.55, rgb);
        } else {
          const u = 0.5 + 0.5 * nx;
          const v = 0.5 + 0.5 * ny;
          const stripe = 0.5 + 0.5 * Math.sin((u * 8 + v * 6 + time * 0.35) * Math.PI * 2);
          const grad = 0.35 + 0.65 * v;
          rgb[0] = 70 + 150 * grad + 30 * stripe;
          rgb[1] = 80 + 120 * grad + 25 * stripe;
          rgb[2] = 110 + 110 * grad + 45 * stripe;
        }

        const litR = rgb[0] * diffuseTerm + 255 * (spec + rim);
        const litG = rgb[1] * diffuseTerm + 255 * (spec + rim * 0.8);
        const litB = rgb[2] * diffuseTerm + 255 * (spec + rim);

        data[idx] = clamp(lerp(bgShade, litR, blend), 0, 255);
        data[idx + 1] = clamp(lerp(bgShade, litG, blend), 0, 255);
        data[idx + 2] = clamp(lerp(bgShade + 2, litB, blend), 0, 255);
        data[idx + 3] = 255;
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);
    ctx.imageSmoothingEnabled = Boolean(smoothing);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(this.bufferCanvas as HTMLCanvasElement, 0, 0, bufW, bufH, 0, 0, width, height);

    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = glow;
      ctx.drawImage(this.bufferCanvas as HTMLCanvasElement, -width * 0.005, -height * 0.005, width * 1.01, height * 1.01);
      ctx.restore();
    }
  }

  private ensureBuffer(bufW: number, bufH: number): void {
    if (this.bufW === bufW && this.bufH === bufH && this.bufferCanvas && this.bufferCtx && this.imageData) {
      return;
    }
    this.bufW = bufW;
    this.bufH = bufH;
    const canvas = document.createElement("canvas");
    canvas.width = bufW;
    canvas.height = bufH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    this.bufferCanvas = canvas;
    this.bufferCtx = ctx;
    this.imageData = ctx.createImageData(bufW, bufH);
    this.data = this.imageData.data;
  }

  private ensureBalls(count: number, baseRadius: number, radiusVar: number, seed: number): void {
    if (this.count === count && this.baseRadius === baseRadius && this.radiusVar === radiusVar && this.seed === seed) {
      return;
    }

    this.count = count;
    this.baseRadius = baseRadius;
    this.radiusVar = radiusVar;
    this.seed = seed;

    this.ballRadius = new Float32Array(count);
    this.phase = new Float32Array(count);
    this.freqX = new Float32Array(count);
    this.freqY = new Float32Array(count);
    this.px = new Float32Array(count);
    this.py = new Float32Array(count);

    const random = createSeededRng(seed);
    for (let i = 0; i < count; i += 1) {
      const radius = baseRadius + (random() * 2 - 1) * radiusVar;
      this.ballRadius[i] = Math.max(4, radius);
      this.phase[i] = random() * Math.PI * 2;
      this.freqX[i] = 0.6 + random() * 0.9;
      this.freqY[i] = 0.6 + random() * 0.9;
    }
  }
}
