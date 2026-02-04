import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type ShadeMode = "hybrid" | "shadebobs" | "bobs";

type BlendMode = "lighter" | "screen";

type ShadebobsSettings = {
  mode: ShadeMode;
  shadeCount: number;
  bobCount: number;
  shadeScale: number;
  blobRadius: number;
  trailFade: number;
  blend: BlendMode;
  hueSpeed: number;
  steer: number;
  maxSpeed: number;
  spriteSize: number;
  boingCheckers: boolean;
  bobAlpha: number;
  fastBlob: boolean;
  audioReact: number;
  beatPulseStrength: number;
  dirtyRects: boolean;
  seed: number | null;
};

const DEFAULTS: ShadebobsSettings = {
  mode: "hybrid",
  shadeCount: 28,
  bobCount: 40,
  shadeScale: 2,
  blobRadius: 70,
  trailFade: 0.12,
  blend: "lighter",
  hueSpeed: 40,
  steer: 40,
  maxSpeed: 220,
  spriteSize: 48,
  boingCheckers: true,
  bobAlpha: 0.95,
  fastBlob: false,
  audioReact: 0.7,
  beatPulseStrength: 0.7,
  dirtyRects: false,
  seed: null
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

const clampInt = (value: number, min: number, max: number): number =>
  clamp(Math.round(value), min, max);

const mulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export class ShadebobsBobsEffect implements Effect {
  private shadeCanvas: HTMLCanvasElement;
  private shadeCtx: CanvasRenderingContext2D;
  private spriteCanvas: HTMLCanvasElement;
  private spriteCtx: CanvasRenderingContext2D;
  private moversCount = 0;
  private positionsX = new Float32Array(0);
  private positionsY = new Float32Array(0);
  private velocitiesX = new Float32Array(0);
  private velocitiesY = new Float32Array(0);
  private phases = new Float32Array(0);
  private hueOffsets = new Float32Array(0);
  private prevBobX = new Float32Array(0);
  private prevBobY = new Float32Array(0);
  private lastWidth = 0;
  private lastHeight = 0;
  private lastShadeScale = 0;
  private lastSpriteSize = 0;
  private lastBoingCheckers = DEFAULTS.boingCheckers;
  private lastSeed: number | null = null;
  private lastTime = 0;
  private beatPulse = 0;

  constructor() {
    this.shadeCanvas = document.createElement("canvas");
    const shadeCtx = this.shadeCanvas.getContext("2d");
    if (!shadeCtx) {
      throw new Error("Unable to create shadebobs canvas");
    }
    this.shadeCtx = shadeCtx;

    this.spriteCanvas = document.createElement("canvas");
    const spriteCtx = this.spriteCanvas.getContext("2d");
    if (!spriteCtx) {
      throw new Error("Unable to create shadebobs sprite canvas");
    }
    this.spriteCtx = spriteCtx;
  }

  reset(): void {
    this.moversCount = 0;
    this.positionsX = new Float32Array(0);
    this.positionsY = new Float32Array(0);
    this.velocitiesX = new Float32Array(0);
    this.velocitiesY = new Float32Array(0);
    this.phases = new Float32Array(0);
    this.hueOffsets = new Float32Array(0);
    this.prevBobX = new Float32Array(0);
    this.prevBobY = new Float32Array(0);
    this.lastSeed = null;
    this.lastTime = 0;
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const settings = this.resolveSettings(params);
    const moverCount = Math.max(settings.shadeCount, settings.bobCount);
    this.ensureCanvases(width, height, settings.shadeScale);
    this.ensureMovers(moverCount, settings.seed, width, height, settings.maxSpeed);
    this.ensureSprite(settings.spriteSize, settings.boingCheckers);

    const dt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;

    if (audio.beat) {
      this.beatPulse = 1;
    }
    this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    const pulseBoost = this.beatPulse * settings.beatPulseStrength;

    const bassBoost = audio.bass * settings.audioReact;
    const speedBoost = 1 + pulseBoost * 0.35;
    const radiusClamp = Math.max(settings.blobRadius, settings.spriteSize * 0.5);

    for (let i = 0; i < this.moversCount; i += 1) {
      let x = this.positionsX[i];
      let y = this.positionsY[i];
      let vx = this.velocitiesX[i];
      let vy = this.velocitiesY[i];

      vx += Math.sin(time * 0.9 + this.phases[i]) * settings.steer * dt;
      vy += Math.cos(time * 1.1 + this.phases[i]) * settings.steer * dt;

      x += vx * dt * speedBoost;
      y += vy * dt * speedBoost;

      if (x < radiusClamp) {
        x = radiusClamp;
        vx = Math.abs(vx);
      } else if (x > width - radiusClamp) {
        x = width - radiusClamp;
        vx = -Math.abs(vx);
      }

      if (y < radiusClamp) {
        y = radiusClamp;
        vy = Math.abs(vy);
      } else if (y > height - radiusClamp) {
        y = height - radiusClamp;
        vy = -Math.abs(vy);
      }

      const speed = Math.hypot(vx, vy);
      if (speed > settings.maxSpeed) {
        const scale = settings.maxSpeed / speed;
        vx *= scale;
        vy *= scale;
      }

      this.positionsX[i] = x;
      this.positionsY[i] = y;
      this.velocitiesX[i] = vx;
      this.velocitiesY[i] = vy;
    }

    if (settings.dirtyRects && settings.mode !== "shadebobs") {
      const clearSize = settings.spriteSize * 1.2;
      for (let i = 0; i < settings.bobCount; i += 1) {
        ctx.clearRect(
          this.prevBobX[i] - clearSize * 0.5,
          this.prevBobY[i] - clearSize * 0.5,
          clearSize,
          clearSize
        );
      }
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    if (settings.mode !== "bobs") {
      this.renderShadebobs(settings, time, bassBoost, pulseBoost);

      const prevSmoothing = ctx.imageSmoothingEnabled;
      if (settings.shadeScale > 1) {
        ctx.imageSmoothingEnabled = false;
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(this.shadeCanvas, 0, 0, this.shadeCanvas.width, this.shadeCanvas.height, 0, 0, width, height);
      ctx.imageSmoothingEnabled = prevSmoothing;
    }

    if (settings.mode !== "shadebobs") {
      ctx.globalCompositeOperation = "source-over";
      const tintAlphaBase = 0.16 + bassBoost * 0.24 + pulseBoost * 0.2;
      for (let i = 0; i < settings.bobCount; i += 1) {
        const x = this.positionsX[i];
        const y = this.positionsY[i];
        const phase = this.phases[i];
        const wobble = 0.5 + 0.5 * Math.sin(time * 2 + phase);
        const scale = (0.75 + 0.25 * wobble) * (1 + bassBoost * 0.12 + pulseBoost * 0.1);
        const size = settings.spriteSize * scale;
        const hue = (time * settings.hueSpeed + this.hueOffsets[i]) % 360;
        const rotation = settings.boingCheckers ? time * 0.7 + phase : 0;

        ctx.save();
        ctx.translate(x, y);
        if (rotation !== 0) {
          ctx.rotate(rotation);
        }
        ctx.globalAlpha = settings.bobAlpha;
        ctx.drawImage(this.spriteCanvas, -size * 0.5, -size * 0.5, size, size);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${tintAlphaBase})`;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        this.prevBobX[i] = x;
        this.prevBobY[i] = y;
      }
    }

    ctx.globalCompositeOperation = "source-over";
  }

  private resolveSettings(params: Record<string, number>): ShadebobsSettings {
    const rawParams = params as Record<string, unknown>;
    const mode = resolveStringParam(rawParams.mode, DEFAULTS.mode) as ShadeMode;
    const blend = resolveStringParam(rawParams.blend, DEFAULTS.blend) as BlendMode;
    const seedValue = resolveNumberParam(rawParams.seed, Number.NaN);

    return {
      mode: mode === "shadebobs" || mode === "bobs" ? mode : "hybrid",
      shadeCount: clampInt(resolveNumberParam(rawParams.shadeCount, DEFAULTS.shadeCount), 4, 80),
      bobCount: clampInt(resolveNumberParam(rawParams.bobCount, DEFAULTS.bobCount), 4, 140),
      shadeScale: clampInt(resolveNumberParam(rawParams.shadeScale, DEFAULTS.shadeScale), 1, 3),
      blobRadius: resolveNumberParam(rawParams.blobRadius, DEFAULTS.blobRadius),
      trailFade: clamp(resolveNumberParam(rawParams.trailFade, DEFAULTS.trailFade), 0, 1),
      blend: blend === "screen" ? "screen" : "lighter",
      hueSpeed: resolveNumberParam(rawParams.hueSpeed, DEFAULTS.hueSpeed),
      steer: resolveNumberParam(rawParams.steer, DEFAULTS.steer),
      maxSpeed: resolveNumberParam(rawParams.maxSpeed, DEFAULTS.maxSpeed),
      spriteSize: resolveNumberParam(rawParams.spriteSize, DEFAULTS.spriteSize),
      boingCheckers: resolveBooleanParam(rawParams.boingCheckers, DEFAULTS.boingCheckers),
      bobAlpha: clamp(resolveNumberParam(rawParams.bobAlpha, DEFAULTS.bobAlpha), 0, 1),
      fastBlob: resolveBooleanParam(rawParams.fastBlob, DEFAULTS.fastBlob),
      audioReact: clamp(resolveNumberParam(rawParams.audioReact, DEFAULTS.audioReact), 0, 1),
      beatPulseStrength: clamp(resolveNumberParam(rawParams.beatPulseStrength, DEFAULTS.beatPulseStrength), 0, 1),
      dirtyRects: resolveBooleanParam(rawParams.dirtyRects, DEFAULTS.dirtyRects),
      seed: Number.isFinite(seedValue) ? seedValue : null
    };
  }

  private ensureCanvases(width: number, height: number, shadeScale: number): void {
    if (width === this.lastWidth && height === this.lastHeight && shadeScale === this.lastShadeScale) {
      return;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    this.lastShadeScale = shadeScale;

    const shadeWidth = Math.max(1, Math.floor(width / shadeScale));
    const shadeHeight = Math.max(1, Math.floor(height / shadeScale));

    this.shadeCanvas.width = shadeWidth;
    this.shadeCanvas.height = shadeHeight;
  }

  private ensureMovers(count: number, seed: number | null, width: number, height: number, maxSpeed: number): void {
    if (count === this.moversCount && seed === this.lastSeed && width === this.lastWidth && height === this.lastHeight) {
      return;
    }

    const rng = seed === null ? Math.random : mulberry32(Math.floor(seed * 1000 + count * 13));

    this.moversCount = count;
    this.lastSeed = seed;
    this.positionsX = new Float32Array(count);
    this.positionsY = new Float32Array(count);
    this.velocitiesX = new Float32Array(count);
    this.velocitiesY = new Float32Array(count);
    this.phases = new Float32Array(count);
    this.hueOffsets = new Float32Array(count);
    this.prevBobX = new Float32Array(count);
    this.prevBobY = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const base = rng();
      this.positionsX[i] = rng() * width;
      this.positionsY[i] = rng() * height;
      const angle = rng() * Math.PI * 2;
      const speed = (0.35 + rng() * 0.65) * maxSpeed;
      this.velocitiesX[i] = Math.cos(angle) * speed;
      this.velocitiesY[i] = Math.sin(angle) * speed;
      this.phases[i] = base * Math.PI * 2;
      this.hueOffsets[i] = rng() * 360;
      this.prevBobX[i] = this.positionsX[i];
      this.prevBobY[i] = this.positionsY[i];
    }
  }

  private ensureSprite(spriteSize: number, boingCheckers: boolean): void {
    if (spriteSize === this.lastSpriteSize && boingCheckers === this.lastBoingCheckers) {
      return;
    }
    this.lastSpriteSize = spriteSize;
    this.lastBoingCheckers = boingCheckers;

    const size = Math.max(8, Math.round(spriteSize));
    this.spriteCanvas.width = size;
    this.spriteCanvas.height = size;

    const ctx = this.spriteCtx;
    ctx.clearRect(0, 0, size, size);

    const radius = size * 0.48;
    const center = size * 0.5;
    const gradient = ctx.createRadialGradient(center - radius * 0.3, center - radius * 0.3, radius * 0.1, center, center, radius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    gradient.addColorStop(0.5, "rgba(180, 180, 210, 0.85)");
    gradient.addColorStop(1, "rgba(30, 30, 60, 0.6)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    if (boingCheckers) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.clip();

      const tile = Math.max(4, Math.floor(size / 6));
      for (let y = 0; y < size; y += tile) {
        for (let x = 0; x < size; x += tile) {
          const isDark = (Math.floor(x / tile) + Math.floor(y / tile)) % 2 === 0;
          ctx.fillStyle = isDark ? "rgba(20, 20, 40, 0.35)" : "rgba(240, 240, 255, 0.18)";
          ctx.fillRect(x, y, tile, tile);
        }
      }
      ctx.restore();
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.arc(center - radius * 0.35, center - radius * 0.35, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderShadebobs(settings: ShadebobsSettings, time: number, bassBoost: number, pulseBoost: number): void {
    const ctx = this.shadeCtx;
    const scale = settings.shadeScale;
    const width = this.shadeCanvas.width;
    const height = this.shadeCanvas.height;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(0, 0, 0, ${settings.trailFade})`;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = settings.blend;

    const radius = (settings.blobRadius / scale) * (1 + bassBoost * 0.3 + pulseBoost * 0.25);
    const alphaBoost = 0.35 + bassBoost * 0.5 + pulseBoost * 0.4;

    for (let i = 0; i < settings.shadeCount; i += 1) {
      const bx = this.positionsX[i] / scale;
      const by = this.positionsY[i] / scale;
      const hue = (time * settings.hueSpeed + this.hueOffsets[i]) % 360;

      if (settings.fastBlob) {
        ctx.fillStyle = `hsla(${hue}, 95%, 60%, ${alphaBoost})`;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const gradient = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        gradient.addColorStop(0, `hsla(${hue}, 95%, 60%, ${alphaBoost})`);
        gradient.addColorStop(1, `hsla(${hue}, 95%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
