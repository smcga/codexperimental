import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const PARTICLE_ATTRACTORS_DEFAULTS = {
  count: 600,
  seed: 1337,
  attractorCount: 2,
  strength: 1800,
  swirl: 0.65,
  damping: 0.985,
  speedLimit: 240,
  softening: 24,
  absorbRadius: 10,
  spawnMode: "edges" as "edges" | "ring" | "random",
  trailAlpha: 0.14,
  particleSize: 1.6,
  glow: 0.8,
  motion: 0.35,
  audioReactive: 0.5,
  beatPulse: 0.7,
  colorMode: "era" as "mono" | "era" | "heat",
  backgroundFade: 0.12,
  vignette: 0.16
};

type ParticleAttractorsParams = {
  count: number;
  seed: number;
  attractorCount: number;
  strength: number;
  swirl: number;
  damping: number;
  speedLimit: number;
  softening: number;
  absorbRadius: number;
  spawnMode: "edges" | "ring" | "random";
  trailAlpha: number;
  particleSize: number;
  glow: number;
  motion: number;
  audioReactive: number;
  beatPulse: number;
  colorMode: "mono" | "era" | "heat";
  backgroundFade: number;
  vignette: number;
};

const asNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;

export const clampAttractorCount = (value: number): number => Math.round(clamp(value, 1, 4));

const eraCountMultiplier = (era?: string): number => {
  if (era === "8bit") {
    return 0.5;
  }
  if (era === "16bit") {
    return 0.75;
  }
  if (era === "future") {
    return 1.15;
  }
  return 1;
};

const eraGlowMultiplier = (era?: string): number => {
  if (era === "8bit" || era === "16bit") {
    return 0.45;
  }
  if (era === "future") {
    return 1.25;
  }
  return 1;
};

export const normalizeParticleAttractorsParams = (
  params: Record<string, unknown>,
  era?: string
): ParticleAttractorsParams => {
  const countBase = asNumber(params.count, PARTICLE_ATTRACTORS_DEFAULTS.count) * eraCountMultiplier(era);

  return {
    count: Math.round(clamp(countBase, 50, 3000)),
    seed: Math.round(clamp(asNumber(params.seed, PARTICLE_ATTRACTORS_DEFAULTS.seed), 0, 999_999)),
    attractorCount: clampAttractorCount(asNumber(params.attractorCount, PARTICLE_ATTRACTORS_DEFAULTS.attractorCount)),
    strength: clamp(asNumber(params.strength, PARTICLE_ATTRACTORS_DEFAULTS.strength), 100, 6000),
    swirl: clamp(asNumber(params.swirl, PARTICLE_ATTRACTORS_DEFAULTS.swirl), -2.5, 2.5),
    damping: clamp(asNumber(params.damping, PARTICLE_ATTRACTORS_DEFAULTS.damping), 0.85, 0.9999),
    speedLimit: clamp(asNumber(params.speedLimit, PARTICLE_ATTRACTORS_DEFAULTS.speedLimit), 30, 900),
    softening: clamp(asNumber(params.softening, PARTICLE_ATTRACTORS_DEFAULTS.softening), 2, 160),
    absorbRadius: clamp(asNumber(params.absorbRadius, PARTICLE_ATTRACTORS_DEFAULTS.absorbRadius), 0, 80),
    spawnMode: resolveEnum(params.spawnMode, ["edges", "ring", "random"] as const, PARTICLE_ATTRACTORS_DEFAULTS.spawnMode),
    trailAlpha: clamp(asNumber(params.trailAlpha, PARTICLE_ATTRACTORS_DEFAULTS.trailAlpha), 0.01, 0.6),
    particleSize: clamp(asNumber(params.particleSize, PARTICLE_ATTRACTORS_DEFAULTS.particleSize), 0.5, 4),
    glow: clamp(asNumber(params.glow, PARTICLE_ATTRACTORS_DEFAULTS.glow), 0, 2.5) * eraGlowMultiplier(era),
    motion: clamp(asNumber(params.motion, PARTICLE_ATTRACTORS_DEFAULTS.motion), 0, 1.5),
    audioReactive: clamp(asNumber(params.audioReactive, PARTICLE_ATTRACTORS_DEFAULTS.audioReactive), 0, 1),
    beatPulse: clamp(asNumber(params.beatPulse, PARTICLE_ATTRACTORS_DEFAULTS.beatPulse), 0, 2),
    colorMode: resolveEnum(params.colorMode, ["mono", "era", "heat"] as const, PARTICLE_ATTRACTORS_DEFAULTS.colorMode),
    backgroundFade: clamp(asNumber(params.backgroundFade, PARTICLE_ATTRACTORS_DEFAULTS.backgroundFade), 0, 0.5),
    vignette: clamp(asNumber(params.vignette, PARTICLE_ATTRACTORS_DEFAULTS.vignette), 0, 0.6)
  };
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

type AttractorState = {
  x: number;
  y: number;
  strength: number;
};

export const computeAttractorAccel = (
  px: number,
  py: number,
  attractors: AttractorState[],
  strength: number,
  swirl: number,
  softening: number,
  maxAccel: number
): { ax: number; ay: number } => {
  const softSq = softening * softening;
  let ax = 0;
  let ay = 0;

  for (let i = 0; i < attractors.length; i += 1) {
    const attractor = attractors[i];
    const dx = attractor.x - px;
    const dy = attractor.y - py;
    const distSq = Math.max(dx * dx + dy * dy, softSq);
    const invDist = 1 / Math.sqrt(distSq);
    const nx = dx * invDist;
    const ny = dy * invDist;
    const force = (strength * attractor.strength) / distSq;

    ax += nx * force;
    ay += ny * force;

    const tangent = force * swirl;
    ax += -ny * tangent;
    ay += nx * tangent;
  }

  const magSq = ax * ax + ay * ay;
  if (magSq > maxAccel * maxAccel) {
    const invMag = maxAccel / Math.sqrt(magSq);
    ax *= invMag;
    ay *= invMag;
  }

  return { ax, ay };
};

export const respawnParticleInBounds = (
  index: number,
  width: number,
  height: number,
  mode: "edges" | "ring" | "random",
  centerX: number,
  centerY: number,
  random: () => number,
  positionsX: Float32Array,
  positionsY: Float32Array,
  velocitiesX: Float32Array,
  velocitiesY: Float32Array,
  ages: Float32Array,
  maxAges: Float32Array
): void => {
  if (mode === "edges") {
    const side = Math.floor(random() * 4);
    if (side === 0) {
      positionsX[index] = 0;
      positionsY[index] = random() * height;
    } else if (side === 1) {
      positionsX[index] = width;
      positionsY[index] = random() * height;
    } else if (side === 2) {
      positionsX[index] = random() * width;
      positionsY[index] = 0;
    } else {
      positionsX[index] = random() * width;
      positionsY[index] = height;
    }
  } else if (mode === "ring") {
    const angle = random() * Math.PI * 2;
    const radius = Math.min(width, height) * (0.3 + random() * 0.35);
    positionsX[index] = centerX + Math.cos(angle) * radius;
    positionsY[index] = centerY + Math.sin(angle) * radius;
  } else {
    positionsX[index] = random() * width;
    positionsY[index] = random() * height;
  }

  velocitiesX[index] = (random() - 0.5) * 14;
  velocitiesY[index] = (random() - 0.5) * 14;
  ages[index] = 0;
  maxAges[index] = 4 + random() * 8;
};

export class ParticleAttractorsEffect implements Effect {
  private random = mulberry32(PARTICLE_ATTRACTORS_DEFAULTS.seed);
  private particleCount = 0;
  private positionsX = new Float32Array(0);
  private positionsY = new Float32Array(0);
  private velocitiesX = new Float32Array(0);
  private velocitiesY = new Float32Array(0);
  private ages = new Float32Array(0);
  private maxAges = new Float32Array(0);
  private attractors: AttractorState[] = [];
  private simWidth = 0;
  private simHeight = 0;
  private activeSeed = PARTICLE_ATTRACTORS_DEFAULTS.seed;
  private buffer: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private beatEnergy = 0;

  reset(): void {
    this.particleCount = 0;
    this.positionsX = new Float32Array(0);
    this.positionsY = new Float32Array(0);
    this.velocitiesX = new Float32Array(0);
    this.velocitiesY = new Float32Array(0);
    this.ages = new Float32Array(0);
    this.maxAges = new Float32Array(0);
    this.attractors = [];
    this.simWidth = 0;
    this.simHeight = 0;
    this.buffer = null;
    this.bufferCtx = null;
    this.beatEnergy = 0;
    this.random = mulberry32(this.activeSeed);
  }

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const resolved = normalizeParticleAttractorsParams(params as Record<string, unknown>, era);
    const dt = clamp(delta, 0, 0.05);

    if (resolved.seed !== this.activeSeed) {
      this.activeSeed = resolved.seed;
      this.random = mulberry32(this.activeSeed);
      this.allocateParticles(resolved.count, width, height, resolved.spawnMode);
    }

    this.ensureBuffer(width, height);
    this.allocateParticles(resolved.count, width, height, resolved.spawnMode);

    const bufferCtx = this.bufferCtx;
    if (!bufferCtx || !this.buffer) {
      return;
    }

    const reactive = resolved.audioReactive;
    const beatStrength = clamp(audio.beatStrength, 0, 1);
    this.beatEnergy = audio.beat ? 1 : Math.max(0, this.beatEnergy - dt * 2.4);

    const pulse = (beatStrength * 0.55 + this.beatEnergy * 0.45) * resolved.beatPulse * reactive;
    const motion = resolved.motion * (1 + audio.rms * 0.35 * reactive);
    const strength = resolved.strength * (1 + (audio.bass * 0.3 + pulse * 0.45));
    const swirl = resolved.swirl * (1 + audio.rms * 0.2 * reactive + pulse * 0.25);

    this.updateAttractors(width, height, time, motion, resolved.attractorCount, audio.bass * reactive, pulse);

    bufferCtx.save();
    bufferCtx.globalCompositeOperation = "source-over";
    if (resolved.backgroundFade > 0) {
      bufferCtx.fillStyle = `rgba(0, 0, 0, ${resolved.backgroundFade})`;
      bufferCtx.fillRect(0, 0, width, height);
    }
    bufferCtx.fillStyle = `rgba(0, 0, 0, ${resolved.trailAlpha})`;
    bufferCtx.fillRect(0, 0, width, height);

    this.updateParticles(dt, width, height, strength, swirl, resolved);

    const brightness = clamp(0.6 + pulse * 0.45 + audio.treble * 0.35 * reactive, 0.25, 1.5);
    this.drawParticles(bufferCtx, resolved, brightness, era);
    this.drawAttractorHalos(bufferCtx, resolved, pulse);
    if (resolved.vignette > 0) {
      this.drawVignette(bufferCtx, width, height, resolved.vignette);
    }
    bufferCtx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(this.buffer, 0, 0, width, height);
    ctx.restore();
  }

  private ensureBuffer(width: number, height: number): void {
    if (!this.buffer) {
      this.buffer = document.createElement("canvas");
      this.bufferCtx = this.buffer.getContext("2d");
    }
    if (!this.buffer || !this.bufferCtx) {
      return;
    }
    if (this.buffer.width !== width || this.buffer.height !== height) {
      this.buffer.width = width;
      this.buffer.height = height;
      this.bufferCtx.globalCompositeOperation = "source-over";
      this.bufferCtx.fillStyle = "#000";
      this.bufferCtx.fillRect(0, 0, width, height);
      this.simWidth = 0;
      this.simHeight = 0;
    }
  }

  private allocateParticles(count: number, width: number, height: number, mode: "edges" | "ring" | "random"): void {
    if (this.particleCount === count && this.simWidth === width && this.simHeight === height) {
      return;
    }

    this.particleCount = count;
    this.simWidth = width;
    this.simHeight = height;
    this.positionsX = new Float32Array(count);
    this.positionsY = new Float32Array(count);
    this.velocitiesX = new Float32Array(count);
    this.velocitiesY = new Float32Array(count);
    this.ages = new Float32Array(count);
    this.maxAges = new Float32Array(count);

    const cx = width * 0.5;
    const cy = height * 0.5;
    for (let i = 0; i < count; i += 1) {
      respawnParticleInBounds(
        i,
        width,
        height,
        mode,
        cx,
        cy,
        this.random,
        this.positionsX,
        this.positionsY,
        this.velocitiesX,
        this.velocitiesY,
        this.ages,
        this.maxAges
      );
    }
  }

  private updateAttractors(
    width: number,
    height: number,
    time: number,
    motion: number,
    count: number,
    bass: number,
    pulse: number
  ): void {
    if (this.attractors.length !== count) {
      this.attractors = Array.from({ length: count }, () => ({ x: 0, y: 0, strength: 1 }));
    }

    const cx = width * 0.5;
    const cy = height * 0.5;
    const radiusX = width * (0.23 + motion * 0.08);
    const radiusY = height * (0.14 + motion * 0.07);

    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      const angle = t * Math.PI * 2 + time * (0.12 + motion * 0.15);
      const wobbleX = Math.sin(time * (0.22 + i * 0.03) + i * 1.7) * width * 0.03 * motion;
      const wobbleY = Math.cos(time * (0.18 + i * 0.04) + i * 2.1) * height * 0.04 * motion;
      this.attractors[i].x = cx + Math.cos(angle) * radiusX + wobbleX;
      this.attractors[i].y = cy + Math.sin(angle * 1.13) * radiusY + wobbleY;
      this.attractors[i].strength = 1 + bass * 0.16 + pulse * 0.34;
    }
  }

  private updateParticles(
    dt: number,
    width: number,
    height: number,
    strength: number,
    swirl: number,
    params: ParticleAttractorsParams
  ): void {
    const dampingStep = Math.pow(params.damping, dt * 60);
    const margin = Math.max(width, height) * 0.2;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const maxAccel = params.speedLimit * 1.8;

    for (let i = 0; i < this.particleCount; i += 1) {
      const px = this.positionsX[i];
      const py = this.positionsY[i];

      const accel = computeAttractorAccel(px, py, this.attractors, strength, swirl, params.softening, maxAccel);
      let vx = this.velocitiesX[i] + accel.ax * dt;
      let vy = this.velocitiesY[i] + accel.ay * dt;

      const speedSq = vx * vx + vy * vy;
      const speedLimit = params.speedLimit;
      if (speedSq > speedLimit * speedLimit) {
        const inv = speedLimit / Math.sqrt(speedSq);
        vx *= inv;
        vy *= inv;
      }

      vx *= dampingStep;
      vy *= dampingStep;

      const nx = px + vx * dt;
      const ny = py + vy * dt;

      this.positionsX[i] = nx;
      this.positionsY[i] = ny;
      this.velocitiesX[i] = vx;
      this.velocitiesY[i] = vy;
      this.ages[i] += dt;

      const outOfBounds = nx < -margin || nx > width + margin || ny < -margin || ny > height + margin;
      const expired = this.ages[i] > this.maxAges[i];
      let absorbed = false;
      for (let j = 0; j < this.attractors.length; j += 1) {
        const dx = this.attractors[j].x - nx;
        const dy = this.attractors[j].y - ny;
        if (dx * dx + dy * dy <= params.absorbRadius * params.absorbRadius) {
          absorbed = true;
          break;
        }
      }

      if (outOfBounds || expired || absorbed) {
        respawnParticleInBounds(
          i,
          width,
          height,
          params.spawnMode,
          centerX,
          centerY,
          this.random,
          this.positionsX,
          this.positionsY,
          this.velocitiesX,
          this.velocitiesY,
          this.ages,
          this.maxAges
        );
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, params: ParticleAttractorsParams, brightness: number, era?: string): void {
    const size = params.particleSize;
    const glowPasses = Math.max(1, Math.round(1 + params.glow));

    ctx.globalCompositeOperation = "lighter";
    for (let pass = 0; pass < glowPasses; pass += 1) {
      const passSize = size + pass * 0.8;
      for (let i = 0; i < this.particleCount; i += 1) {
        const ageNorm = this.ages[i] / Math.max(0.001, this.maxAges[i]);
        const alpha = (1 - ageNorm * 0.7) * brightness * (pass === 0 ? 0.6 : 0.22);
        ctx.fillStyle = this.resolveParticleColor(i, alpha, params.colorMode, era);
        ctx.fillRect(this.positionsX[i], this.positionsY[i], passSize, passSize);
      }
    }
    ctx.globalCompositeOperation = "source-over";
  }

  private resolveParticleColor(index: number, alpha: number, mode: "mono" | "era" | "heat", era?: string): string {
    if (mode === "mono") {
      return `rgba(210, 235, 255, ${alpha})`;
    }

    if (mode === "heat") {
      const speed = Math.hypot(this.velocitiesX[index], this.velocitiesY[index]);
      const heat = clamp(speed / 220, 0, 1);
      const hue = 35 + heat * 210;
      const light = 55 + heat * 25;
      return `hsla(${hue}, 95%, ${light}%, ${alpha})`;
    }

    if (era === "8bit" || era === "16bit") {
      return `rgba(190, 220, 255, ${alpha * 0.9})`;
    }
    if (era === "future") {
      return `hsla(195, 95%, 72%, ${alpha})`;
    }
    return `hsla(210, 90%, 70%, ${alpha})`;
  }

  private drawAttractorHalos(ctx: CanvasRenderingContext2D, params: ParticleAttractorsParams, pulse: number): void {
    const radius = params.softening * (1 + pulse * 0.35);
    for (let i = 0; i < this.attractors.length; i += 1) {
      const attractor = this.attractors[i];
      const grad = ctx.createRadialGradient(attractor.x, attractor.y, 0, attractor.x, attractor.y, radius * 2.4);
      grad.addColorStop(0, `rgba(220, 245, 255, ${0.16 + pulse * 0.18})`);
      grad.addColorStop(1, "rgba(80, 140, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(attractor.x, attractor.y, radius * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number): void {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const outer = Math.max(width, height) * 0.75;
    const gradient = ctx.createRadialGradient(cx, cy, outer * 0.2, cx, cy, outer);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${amount})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}
