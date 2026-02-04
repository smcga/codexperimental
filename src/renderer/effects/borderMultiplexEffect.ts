import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SpriteShape = "circle" | "square" | "star";

type SpriteTemplate = {
  shape: SpriteShape;
  sizeScale: number;
  paletteIndex: number;
};

const PALETTE = ["#f94144", "#f3722c", "#f9c74f", "#90be6d", "#43aa8b", "#577590", "#9b5de5", "#f15bb5"];
const SHAPES: SpriteShape[] = ["circle", "square", "star"];

export const BORDER_MULTIPLEX_DEFAULTS = {
  hwSprites: 8,
  totalSprites: 96,
  bandHeight: 24,
  spriteSize: 12,
  speed: 60,
  rasterJitter: 1.5,
  borderMaskStrength: 0.3,
  audioReact: 0.6,
  seed: 0
};

const mulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export class BorderMultiplexEffect implements Effect {
  private templates: SpriteTemplate[] = [];
  private spritesX = new Float32Array(0);
  private spritesY = new Float32Array(0);
  private spritesSpeed = new Float32Array(0);
  private spritesPhase = new Float32Array(0);
  private lastSeed = Number.NaN;
  private lastTotal = 0;
  private lastHw = 0;
  private lastWidth = 0;
  private lastHeight = 0;
  private startTime: number | null = null;
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const hwSprites = clamp(Math.round(params.hwSprites ?? BORDER_MULTIPLEX_DEFAULTS.hwSprites), 4, 16);
    const totalSprites = clamp(Math.round(params.totalSprites ?? BORDER_MULTIPLEX_DEFAULTS.totalSprites), 16, 160);
    const bandHeight = clamp(Math.round(params.bandHeight ?? BORDER_MULTIPLEX_DEFAULTS.bandHeight), 12, 64);
    const spriteSize = clamp(params.spriteSize ?? BORDER_MULTIPLEX_DEFAULTS.spriteSize, 6, 24);
    const speed = clamp(params.speed ?? BORDER_MULTIPLEX_DEFAULTS.speed, 20, 200);
    const rasterJitter = clamp(params.rasterJitter ?? BORDER_MULTIPLEX_DEFAULTS.rasterJitter, 0, 6);
    const borderMaskStrength = clamp(
      params.borderMaskStrength ?? BORDER_MULTIPLEX_DEFAULTS.borderMaskStrength,
      0,
      1
    );
    const audioReact = clamp(params.audioReact ?? BORDER_MULTIPLEX_DEFAULTS.audioReact, 0, 1);
    const seed = Number.isFinite(params.seed) ? (params.seed as number) : BORDER_MULTIPLEX_DEFAULTS.seed;

    this.ensureTemplates(hwSprites, seed);
    this.ensureSprites(totalSprites, width, height, seed);

    if (this.startTime === null) {
      this.startTime = time;
    }
    const elapsed = Math.max(0, time - this.startTime);
    const guideAlpha = clamp(1 - elapsed / 1.0, 0, 1);
    const maskFade = clamp(1 - elapsed / 1.8, 0, 1);

    const beatStrength = audio.beat ? Math.max(0.6, audio.beatStrength) : 0;
    this.beatPulse = Math.max(this.beatPulse - delta * 3.5, beatStrength);
    const beatShift = this.beatPulse * (4 + audioReact * 4);

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const innerWidth = width * 0.86 * (1 - this.beatPulse * 0.05);
    const innerHeight = height * 0.82 * (1 - this.beatPulse * 0.05);
    const innerX = (width - innerWidth) * 0.5;
    const innerY = (height - innerHeight) * 0.5;

    if (guideAlpha > 0.01) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.2 * guideAlpha;
      ctx.strokeRect(innerX, innerY, innerWidth, innerHeight);
    }

    const margin = spriteSize * 2;
    for (let i = 0; i < totalSprites; i += 1) {
      const nextY = this.spritesY[i] + delta * speed * this.spritesSpeed[i];
      this.spritesY[i] = nextY > height + margin ? -margin : nextY;
    }

    const bands = Math.ceil(height / bandHeight);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#0a0a0a";

    for (let b = 0; b < bands; b += 1) {
      const bandTop = b * bandHeight;
      const bandBottom = bandTop + bandHeight;
      const jitterX = Math.sin(time * 20 + b * 3.1) * rasterJitter;
      const bandDrift = Math.sin(time * 6 + b * 0.9) * (0.8 + audioReact) + beatShift * (b % 2 ? 0.25 : -0.25);
      const bandBrightness = 0.75 + 0.25 * Math.sin(b * 0.6 + elapsed * 0.4);
      let bandCount = 0;

      for (let i = 0; i < totalSprites; i += 1) {
        const y = this.spritesY[i];
        if (y < bandTop || y >= bandBottom) {
          continue;
        }
        const template = this.templates[bandCount % hwSprites];
        const overLimit = bandCount >= hwSprites;
        const baseX = this.spritesX[i] + Math.sin(time * 0.7 + this.spritesPhase[i]) * 12;
        const multiplexOffset = overLimit ? (bandCount - hwSprites + 1) * 1.6 : 0;
        const x = baseX + jitterX + multiplexOffset;
        const yDraw = y + bandDrift + (overLimit ? 1.2 : 0);
        const size = spriteSize * template.sizeScale * (1 + audio.bass * 0.25 * audioReact);
        const paletteIndex = (template.paletteIndex + b) % PALETTE.length;

        ctx.globalAlpha = bandBrightness * (overLimit ? 0.55 : 0.95);
        ctx.fillStyle = PALETTE[paletteIndex];

        if (template.shape === "square") {
          const half = size * 0.5;
          ctx.fillRect(x - half, yDraw - half, size, size);
          ctx.strokeRect(x - half, yDraw - half, size, size);
        } else if (template.shape === "circle") {
          ctx.beginPath();
          ctx.arc(x, yDraw, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else {
          this.drawStar(ctx, x, yDraw, size * 0.5, size * 0.25);
        }
        bandCount += 1;
      }
    }

    if (borderMaskStrength > 0.01 && maskFade > 0.01) {
      ctx.globalAlpha = borderMaskStrength * maskFade;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, innerY);
      ctx.fillRect(0, innerY, innerX, innerHeight);
      ctx.fillRect(innerX + innerWidth, innerY, width - (innerX + innerWidth), innerHeight);
      ctx.fillRect(0, innerY + innerHeight, width, height - (innerY + innerHeight));
    }

    ctx.globalAlpha = 1;
  }

  reset(): void {
    this.templates = [];
    this.spritesX = new Float32Array(0);
    this.spritesY = new Float32Array(0);
    this.spritesSpeed = new Float32Array(0);
    this.spritesPhase = new Float32Array(0);
    this.lastSeed = Number.NaN;
    this.lastTotal = 0;
    this.lastHw = 0;
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.startTime = null;
    this.beatPulse = 0;
  }

  private ensureTemplates(hwSprites: number, seed: number): void {
    if (this.templates.length === hwSprites && this.lastHw === hwSprites && this.lastSeed === seed) {
      return;
    }
    const rng = mulberry32(Math.floor(seed * 1000 + hwSprites * 17));
    this.templates = Array.from({ length: hwSprites }, () => ({
      shape: SHAPES[Math.floor(rng() * SHAPES.length)],
      sizeScale: 0.8 + rng() * 0.6,
      paletteIndex: Math.floor(rng() * PALETTE.length)
    }));
    this.lastHw = hwSprites;
    this.lastSeed = seed;
  }

  private ensureSprites(totalSprites: number, width: number, height: number, seed: number): void {
    if (
      this.spritesX.length === totalSprites &&
      this.lastTotal === totalSprites &&
      this.lastWidth === width &&
      this.lastHeight === height &&
      this.lastSeed === seed
    ) {
      return;
    }
    const rng = mulberry32(Math.floor(seed * 1000 + totalSprites * 31));
    this.spritesX = new Float32Array(totalSprites);
    this.spritesY = new Float32Array(totalSprites);
    this.spritesSpeed = new Float32Array(totalSprites);
    this.spritesPhase = new Float32Array(totalSprites);
    for (let i = 0; i < totalSprites; i += 1) {
      this.spritesX[i] = rng() * width;
      this.spritesY[i] = rng() * height;
      this.spritesSpeed[i] = 0.6 + rng() * 0.8;
      this.spritesPhase[i] = rng() * Math.PI * 2;
    }
    this.lastTotal = totalSprites;
    this.lastWidth = width;
    this.lastHeight = height;
    this.lastSeed = seed;
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, innerRadius: number): void {
    const points = 5;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const angle = (Math.PI / points) * i;
      const r = i % 2 === 0 ? radius : innerRadius;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
