import { clamp } from "../../util/math";
import { fitSquareToSafe } from "./framingFit";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;

type DrosteShape = "portal" | "rings" | "grid";
type DrosteFitMode = "auto" | "safe";
type DrosteEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

export type InfiniteZoomDrosteParams = {
  speed: number;
  scaleBase: number;
  rotationSpeed: number;
  detail: number;
  glow: number;
  pulse: number;
  twist: number;
  seed: number;
  shape: DrosteShape;
  fitMode: DrosteFitMode;
};

export const INFINITE_ZOOM_DROSTE_DEFAULTS: InfiniteZoomDrosteParams = {
  speed: 0.35,
  scaleBase: 2,
  rotationSpeed: 0.18,
  detail: 0.75,
  glow: 0.6,
  pulse: 0.5,
  twist: 0.25,
  seed: 1,
  shape: "portal",
  fitMode: "auto"
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveShape = (value: unknown): DrosteShape => {
  if (value === "rings" || value === "grid") {
    return value;
  }
  return "portal";
};

const resolveFitMode = (value: unknown): DrosteFitMode => (value === "safe" ? "safe" : "auto");

const resolveEra = (era?: string): DrosteEra => {
  if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
    return era;
  }
  return "pcdemo";
};

export const normalizeInfiniteZoomDrosteParams = (params: Record<string, unknown>): InfiniteZoomDrosteParams => ({
  speed: clamp(toFiniteNumber(params.speed, INFINITE_ZOOM_DROSTE_DEFAULTS.speed), -1.8, 1.8),
  scaleBase: clamp(toFiniteNumber(params.scaleBase, INFINITE_ZOOM_DROSTE_DEFAULTS.scaleBase), 1.2, 3.8),
  rotationSpeed: clamp(toFiniteNumber(params.rotationSpeed, INFINITE_ZOOM_DROSTE_DEFAULTS.rotationSpeed), -1.2, 1.2),
  detail: clamp(toFiniteNumber(params.detail, INFINITE_ZOOM_DROSTE_DEFAULTS.detail), 0.1, 1),
  glow: clamp(toFiniteNumber(params.glow, INFINITE_ZOOM_DROSTE_DEFAULTS.glow), 0, 1.2),
  pulse: clamp(toFiniteNumber(params.pulse, INFINITE_ZOOM_DROSTE_DEFAULTS.pulse), 0, 1),
  twist: clamp(toFiniteNumber(params.twist, INFINITE_ZOOM_DROSTE_DEFAULTS.twist), -1, 1),
  seed: Math.round(clamp(toFiniteNumber(params.seed, INFINITE_ZOOM_DROSTE_DEFAULTS.seed), 0, 9999)),
  shape: resolveShape(params.shape),
  fitMode: resolveFitMode(params.fitMode)
});

export const computeVisibleLevels = (
  zoomPhase: number,
  scaleBase: number,
  minScale: number,
  maxScale: number,
  levelMin = -2,
  levelMax = 8
): number[] => {
  const frac = zoomPhase - Math.floor(zoomPhase);
  const baseScale = Math.pow(scaleBase, frac);
  const levels: number[] = [];

  for (let k = levelMin; k <= levelMax; k += 1) {
    const scale = baseScale * Math.pow(scaleBase, k);
    if (scale >= minScale && scale <= maxScale) {
      levels.push(scale);
    }
  }

  return levels.sort((a, b) => a - b);
};

const hashedOffset = (seed: number, level: number): number => {
  const value = Math.sin(seed * 17.137 + level * 31.733) * 43758.5453;
  return value - Math.floor(value);
};

const drawPortalMotif = (
  ctx: CanvasRenderingContext2D,
  radius: number,
  time: number,
  levelIndex: number,
  params: InfiniteZoomDrosteParams,
  era: DrosteEra,
  audio: EffectRenderContext["audio"]
): void => {
  const beat = audio.beat ? clamp(audio.beatStrength, 0, 1) : 0;
  const glowBoost = (audio.rms * 0.45 + audio.treble * 0.25 + beat * 0.4) * params.glow;
  const pulse = 1 + (audio.bass * 0.08 + beat * 0.07) * params.pulse;

  const ringCountBase = era === "8bit" ? 2 : era === "future" ? 5 : 3;
  const ringCount = ringCountBase + Math.round(params.detail * (era === "future" ? 4 : 2));

  const frameW = radius * (params.shape === "rings" ? 1.35 : 1.5) * pulse;
  const frameH = radius * (params.shape === "grid" ? 0.86 : 1.05) * pulse;
  const portalScale = 0.62;

  ctx.strokeStyle = `rgba(150, 220, 255, ${clamp(0.25 + glowBoost * 0.6, 0.15, 0.95).toFixed(3)})`;
  ctx.lineWidth = clamp(radius * 0.015, era === "8bit" ? 1.2 : 0.9, 8);

  ctx.beginPath();
  ctx.rect(-frameW * 0.5, -frameH * 0.5, frameW, frameH);
  ctx.stroke();

  ctx.lineWidth *= 0.7;
  ctx.strokeStyle = `rgba(220, 240, 255, ${clamp(0.12 + glowBoost * 0.4, 0.08, 0.7).toFixed(3)})`;
  ctx.strokeRect(-frameW * portalScale * 0.5, -frameH * portalScale * 0.5, frameW * portalScale, frameH * portalScale);

  for (let i = 0; i < ringCount; i += 1) {
    const t = i / Math.max(1, ringCount - 1);
    const alpha = clamp((1 - t) * 0.22 + glowBoost * 0.2, 0.04, 0.7);
    ctx.strokeStyle = `rgba(100, 180, 255, ${alpha.toFixed(3)})`;
    ctx.lineWidth = clamp(radius * 0.006 * (1 - t * 0.55), 0.6, 4);

    if (params.shape === "rings") {
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (0.95 - t * 0.4), radius * (0.72 - t * 0.28), 0, 0, TAU);
      ctx.stroke();
    } else if (params.shape === "grid") {
      const steps = Math.max(3, Math.round(4 + params.detail * 4));
      const gridW = frameW * (0.92 - t * 0.34);
      const gridH = frameH * (0.88 - t * 0.32);
      for (let g = 0; g <= steps; g += 1) {
        const gx = -gridW * 0.5 + (g / steps) * gridW;
        const gy = -gridH * 0.5 + (g / steps) * gridH;
        ctx.beginPath();
        ctx.moveTo(gx, -gridH * 0.5);
        ctx.lineTo(gx, gridH * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-gridW * 0.5, gy);
        ctx.lineTo(gridW * 0.5, gy);
        ctx.stroke();
      }
      break;
    } else {
      const inset = t * 0.42;
      ctx.strokeRect(-frameW * (0.5 - inset * 0.5), -frameH * (0.5 - inset * 0.5), frameW * (1 - inset), frameH * (1 - inset));
    }
  }

  const orbitCount = Math.max(4, Math.round(6 + params.detail * 8 + audio.mid * 2));
  const orbitRadius = radius * 0.9;
  const orbitBaseAngle = time * (0.35 + params.twist * 0.6) + levelIndex * 0.23;
  ctx.fillStyle = `rgba(196, 232, 255, ${clamp(0.18 + glowBoost * 0.5, 0.1, 0.9).toFixed(3)})`;

  for (let i = 0; i < orbitCount; i += 1) {
    const t = i / orbitCount;
    const offset = hashedOffset(params.seed, i + levelIndex * 13) - 0.5;
    const angle = orbitBaseAngle + t * TAU + offset * 0.25;
    const d = orbitRadius * (0.78 + 0.2 * Math.sin(time * 0.4 + i * 1.9));
    const x = Math.cos(angle) * d;
    const y = Math.sin(angle * (1 + params.twist * 0.18)) * d * 0.65;
    const r = clamp(radius * 0.01 * (1 + audio.treble * 1.4), 0.7, 4.2);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
};

const drawRecursiveLevel = (
  ctx: CanvasRenderingContext2D,
  levelScale: number,
  levelIndex: number,
  sceneRadius: number,
  time: number,
  params: InfiniteZoomDrosteParams,
  era: DrosteEra,
  audio: EffectRenderContext["audio"]
): void => {
  const wobble = era === "ps1" ? 1 + Math.sin(time * 10 + levelIndex * 0.8) * 0.012 : 1;
  const rotation = time * params.rotationSpeed + levelIndex * params.twist * 0.23 + hashedOffset(params.seed, levelIndex) * 0.2;
  const alpha = clamp(0.08 + 0.5 / Math.sqrt(levelScale + 0.1), 0.07, 0.65);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.scale(levelScale * wobble, levelScale * wobble);
  ctx.rotate(rotation);
  drawPortalMotif(ctx, sceneRadius, time, levelIndex, params, era, audio);
  ctx.restore();
};

export class InfiniteZoomDrosteEffect implements Effect {
  render({ ctx, width, height, time, audio, params, era, safeRect }: EffectRenderContext): void {
    const p = normalizeInfiniteZoomDrosteParams(params as Record<string, unknown>);
    const activeEra = resolveEra(era);

    const safeSize = safeRect ? fitSquareToSafe(Math.min(width, height), safeRect) : Math.min(width, height);
    const portrait = height > width * 1.1;
    const fitScale = p.fitMode === "safe" || portrait ? 0.78 : 0.9;
    const sceneRadius = Math.max(32, safeSize * fitScale * 0.35);

    const zoomPhase = time * p.speed;
    const minScale = 0.08;
    const maxScale = Math.max(width, height) / Math.max(1, sceneRadius) * 2.8;
    const visibleLevels = computeVisibleLevels(zoomPhase, p.scaleBase, minScale, maxScale);

    const energy = clamp(audio.rms * 0.65 + audio.bass * 0.35, 0, 1);
    const beatPulse = audio.beat ? clamp(audio.beatStrength, 0, 1) : 0;
    const bgGlow = (0.08 + energy * 0.16 + beatPulse * p.pulse * 0.12) * (0.8 + p.glow * 0.5);

    ctx.fillStyle = "rgb(5, 7, 16)";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.5);
    ctx.fillStyle = `rgba(30, 70, 120, ${clamp(bgGlow, 0.05, 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, sceneRadius * 1.8, sceneRadius * 1.45, 0, 0, TAU);
    ctx.fill();

    for (let i = 0; i < visibleLevels.length; i += 1) {
      drawRecursiveLevel(ctx, visibleLevels[i], i, sceneRadius, time, p, activeEra, audio);
    }

    if (activeEra === "16bit" || activeEra === "8bit") {
      ctx.globalAlpha = activeEra === "8bit" ? 0.11 : 0.07;
      ctx.fillStyle = "#ffffff";
      for (let y = -height * 0.5; y < height * 0.5; y += activeEra === "8bit" ? 3 : 2) {
        ctx.fillRect(-width * 0.5, y, width, 1);
      }
    }

    ctx.restore();
  }
}
