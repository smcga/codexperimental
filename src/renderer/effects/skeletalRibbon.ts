import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SkeletalRibbonColorMode = "mono" | "gradient";

type SkeletalRibbonParams = {
  boneCount: number;
  length: number;
  thickness: number;
  waveAmp: number;
  waveFreq: number;
  stiffness: number;
  audioInfluence: number;
  colorMode: SkeletalRibbonColorMode;
  hueShift: number;
  glow: number;
  debugSkeleton: boolean;
};

export const SKELETAL_RIBBON_DEFAULTS = {
  boneCount: 24,
  length: 300,
  thickness: 18,
  waveAmp: 0.6,
  waveFreq: 1.5,
  stiffness: 0.6,
  audioInfluence: 1,
  colorMode: "gradient",
  hueShift: 0.2,
  glow: 0.4,
  debugSkeleton: false
} as const;

type BonePoint = { x: number; y: number };

type SkeletonState = {
  positions: BonePoint[];
  leftPoints: BonePoint[];
  rightPoints: BonePoint[];
  angles: number[];
  smoothedAngles: number[];
  lengths: number[];
};


const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveColorMode = (value: unknown): SkeletalRibbonColorMode =>
  value === "mono" || value === "gradient" ? value : SKELETAL_RIBBON_DEFAULTS.colorMode;

export const resolveSkeletalRibbonParams = (params: Record<string, unknown>, era?: string): SkeletalRibbonParams => {
  const qualityScale = era === "8bit" ? 0.55 : era === "16bit" ? 0.75 : 1;
  const bones = clamp(
    Math.round(toFiniteNumber(params.boneCount, SKELETAL_RIBBON_DEFAULTS.boneCount) * qualityScale),
    8,
    32
  );

  return {
    boneCount: bones,
    length: clamp(toFiniteNumber(params.length, SKELETAL_RIBBON_DEFAULTS.length), 80, 700),
    thickness: clamp(toFiniteNumber(params.thickness, SKELETAL_RIBBON_DEFAULTS.thickness), 2, 56),
    waveAmp: clamp(toFiniteNumber(params.waveAmp, SKELETAL_RIBBON_DEFAULTS.waveAmp), 0, 2),
    waveFreq: clamp(toFiniteNumber(params.waveFreq, SKELETAL_RIBBON_DEFAULTS.waveFreq), 0.05, 6),
    stiffness: clamp(toFiniteNumber(params.stiffness, SKELETAL_RIBBON_DEFAULTS.stiffness), 0.05, 1),
    audioInfluence: clamp(toFiniteNumber(params.audioInfluence, SKELETAL_RIBBON_DEFAULTS.audioInfluence), 0, 2),
    colorMode: resolveColorMode(params.colorMode),
    hueShift: clamp(toFiniteNumber(params.hueShift, SKELETAL_RIBBON_DEFAULTS.hueShift), -1, 1),
    glow: era === "8bit" ? 0 : clamp(toFiniteNumber(params.glow, SKELETAL_RIBBON_DEFAULTS.glow), 0, 1),
    debugSkeleton: toFiniteNumber(params.debugSkeleton, SKELETAL_RIBBON_DEFAULTS.debugSkeleton ? 1 : 0) >= 0.5
  };
};

const ensureState = (state: SkeletonState | null, boneCount: number): SkeletonState => {
  if (state && state.angles.length === boneCount) {
    return state;
  }

  return {
    positions: Array.from({ length: boneCount + 1 }, () => ({ x: 0, y: 0 })),
    leftPoints: Array.from({ length: boneCount }, () => ({ x: 0, y: 0 })),
    rightPoints: Array.from({ length: boneCount }, () => ({ x: 0, y: 0 })),
    angles: Array.from({ length: boneCount }, () => 0),
    smoothedAngles: Array.from({ length: boneCount }, () => 0),
    lengths: Array.from({ length: boneCount }, (_, i) => 0.96 + 0.08 * Math.sin(i * 1.73))
  };
};

const quantizeAngle = (angle: number, era?: string): number => {
  if (era !== "8bit") {
    return angle;
  }
  const step = Math.PI / 8;
  return Math.round(angle / step) * step;
};

export class SkeletalRibbonEffect implements Effect {
  private state: SkeletonState | null = null;

  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params, era }: EffectRenderContext): void {
    const config = resolveSkeletalRibbonParams(params as Record<string, unknown>, era);
    this.state = ensureState(this.state, config.boneCount);

    if (audio.beat) {
      this.beatPulse = 1;
    }
    const decayRate = 1.8 + audio.rms * 3;
    this.beatPulse = Math.max(0, this.beatPulse - delta * decayRate);

    const audioBoost = config.audioInfluence;
    const motionAmp = config.waveAmp * (1 + audio.bass * 0.5 * audioBoost + this.beatPulse * 0.25);
    const segmentLength = config.length / config.boneCount;
    const rootX = width * 0.5 + Math.sin(time * 0.32) * width * 0.03 + Math.sin(time * 1.1) * width * 0.01 * audio.mid;
    const rootY =
      height * 0.5 +
      Math.cos(time * 0.28) * height * 0.04 +
      Math.sin(time * 1.4 + audio.mid * Math.PI) * height * 0.015 * audioBoost;

    this.state.positions[0].x = rootX;
    this.state.positions[0].y = rootY;

    let parentAngle = -Math.PI / 2;
    for (let i = 0; i < config.boneCount; i += 1) {
      const wave = Math.sin(time * config.waveFreq + i * 0.4) * motionAmp;
      const flutter = Math.cos(time * (1.8 + i * 0.01) + i * 0.27) * 0.08;
      const baseAngle = parentAngle + wave + flutter + audio.bass * 0.8 * audioBoost;
      const constrained = clamp(baseAngle, parentAngle - 1.2, parentAngle + 1.2);
      const follow = lerp(parentAngle, constrained, config.stiffness);
      const lagBlend = era === "8bit" ? 0.32 : era === "16bit" ? 0.24 : 0.16;
      const smoothed = lerp(this.state.smoothedAngles[i], follow, clamp(delta * (8 - lagBlend * 10), 0.06, 0.45));
      const quantized = quantizeAngle(smoothed, era);
      this.state.smoothedAngles[i] = smoothed;
      this.state.angles[i] = quantized;
      parentAngle = quantized;

      const p0 = this.state.positions[i];
      const p1 = this.state.positions[i + 1];
      const len = segmentLength * this.state.lengths[i];
      p1.x = p0.x + Math.cos(parentAngle) * len;
      p1.y = p0.y + Math.sin(parentAngle) * len;
    }

    const beatThickness = 1 + this.beatPulse * 0.3;
    const rmsThickness = 1 + audio.rms * 0.5;
    for (let i = 0; i < config.boneCount; i += 1) {
      const p0 = this.state.positions[i];
      const p1 = this.state.positions[i + 1];
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const mag = Math.hypot(dx, dy) || 1;
      const nx = -dy / mag;
      const ny = dx / mag;
      const taper = 1 - i / config.boneCount;
      const waveT = 0.6 + 0.4 * Math.sin(i * 0.5 + time * (era === "8bit" ? 1.2 : 1.8));
      const thickness = config.thickness * taper * waveT * rmsThickness * beatThickness;

      this.state.leftPoints[i].x = p0.x + nx * thickness;
      this.state.leftPoints[i].y = p0.y + ny * thickness;
      this.state.rightPoints[i].x = p0.x - nx * thickness;
      this.state.rightPoints[i].y = p0.y - ny * thickness;
    }

    ctx.beginPath();
    ctx.moveTo(this.state.leftPoints[0].x, this.state.leftPoints[0].y);
    for (let i = 1; i < config.boneCount; i += 1) {
      ctx.lineTo(this.state.leftPoints[i].x, this.state.leftPoints[i].y);
    }
    for (let i = config.boneCount - 1; i >= 0; i -= 1) {
      ctx.lineTo(this.state.rightPoints[i].x, this.state.rightPoints[i].y);
    }
    ctx.closePath();

    if (config.colorMode === "mono") {
      const mono = era === "8bit" ? "rgba(215, 235, 255, 0.8)" : "rgba(230, 245, 255, 0.86)";
      ctx.fillStyle = mono;
    } else {
      const head = this.state.positions[0];
      const tail = this.state.positions[config.boneCount];
      const gradient = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
      const hueA = (time * 40 + config.hueShift * 360) % 360;
      const hueB = (hueA + 70 + config.hueShift * 120) % 360;
      gradient.addColorStop(0, `hsla(${hueA.toFixed(1)} 95% 65% / 0.9)`);
      gradient.addColorStop(1, `hsla(${hueB.toFixed(1)} 95% 50% / 0.8)`);
      ctx.fillStyle = gradient;
    }

    ctx.fill();

    if (config.glow > 0.01) {
      const canFilter = typeof ctx.filter === "string";
      const prevAlpha = ctx.globalAlpha;
      if (canFilter) {
        ctx.filter = "blur(8px)";
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(config.glow * (0.2 + audio.rms * 0.3), 0, 0.5);
      ctx.fill();
      ctx.globalAlpha = prevAlpha;
      ctx.globalCompositeOperation = "source-over";
      if (canFilter) {
        ctx.filter = "none";
      }
    }

    if (config.debugSkeleton) {
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = era === "8bit" ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(this.state.positions[0].x, this.state.positions[0].y);
      for (let i = 1; i <= config.boneCount; i += 1) {
        ctx.lineTo(this.state.positions[i].x, this.state.positions[i].y);
      }
      ctx.stroke();
    }
  }

  reset(): void {
    this.state = null;
    this.beatPulse = 0;
  }
}

export default SkeletalRibbonEffect;
