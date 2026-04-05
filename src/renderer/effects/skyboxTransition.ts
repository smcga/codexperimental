import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const SKYBOX_TRANSITION_DEFAULTS = {
  speed: 1,
  intensity: 1,
  horizon: 0.62,
  cloudAmount: 0.55,
  starAmount: 0.7,
  silhouetteAmount: 0.5,
  surrealness: 0.35,
  audioReactive: 0.4,
  loop: true,
  phaseOffset: 0
} as const;

type Rgb = [number, number, number];

type PaletteState = {
  zenith: Rgb;
  horizon: Rgb;
  glow: Rgb;
  haze: Rgb;
  silhouette: Rgb;
  aurora: Rgb;
};

type PhaseWeights = [number, number, number, number];

type StarPoint = {
  x: number;
  y: number;
  size: number;
  twinkle: number;
};

type RidgePoint = {
  x: number;
  y: number;
};

const CYCLE_SECONDS = 28;
const TWO_PI = Math.PI * 2;
const STATES: PaletteState[] = [
  {
    zenith: [92, 161, 255],
    horizon: [196, 226, 255],
    glow: [255, 238, 198],
    haze: [255, 255, 245],
    silhouette: [44, 62, 84],
    aurora: [162, 221, 255]
  },
  {
    zenith: [81, 79, 173],
    horizon: [255, 159, 103],
    glow: [255, 110, 102],
    haze: [255, 199, 162],
    silhouette: [35, 34, 73],
    aurora: [255, 159, 200]
  },
  {
    zenith: [34, 49, 101],
    horizon: [109, 104, 165],
    glow: [190, 141, 206],
    haze: [132, 132, 193],
    silhouette: [22, 24, 50],
    aurora: [154, 134, 220]
  },
  {
    zenith: [10, 16, 42],
    horizon: [25, 45, 98],
    glow: [99, 191, 255],
    haze: [60, 105, 152],
    silhouette: [10, 12, 24],
    aurora: [132, 95, 255]
  }
];

const softStep = (edge0: number, edge1: number, value: number): number => {
  if (edge0 === edge1) {
    return value < edge0 ? 0 : 1;
  }
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value >= 0.5;
  }
  return fallback;
};

const hash = (value: number): number => {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return n - Math.floor(n);
};

const mixColor = (weights: PhaseWeights, getter: (state: PaletteState) => Rgb): Rgb => {
  const channels: Rgb = [0, 0, 0];
  STATES.forEach((state, index) => {
    const color = getter(state);
    const weight = weights[index] ?? 0;
    channels[0] += color[0] * weight;
    channels[1] += color[1] * weight;
    channels[2] += color[2] * weight;
  });
  return channels;
};

export const getSkyboxPhase = (time: number, speed: number, loop: boolean, phaseOffset: number): number => {
  const progress = (time * Math.max(0.0001, speed)) / CYCLE_SECONDS + phaseOffset;
  if (loop) {
    return ((progress % 1) + 1) % 1;
  }
  return clamp(progress, 0, 1);
};

export const getSkyboxPhaseWeights = (phase: number): PhaseWeights => {
  const wrapped = ((phase % 1) + 1) % 1;
  const centers = [0, 1 / 3, 2 / 3, 1];
  const local = centers.map((center) => {
    const distance = Math.min(Math.abs(wrapped - center), 1 - Math.abs(wrapped - center));
    return 1 - softStep(0, 0.34, distance);
  });
  const total = local.reduce((sum, value) => sum + value, 0);
  if (total <= 0.0001) {
    return [1, 0, 0, 0];
  }
  return [
    local[0] / total,
    local[1] / total,
    local[2] / total,
    local[3] / total
  ];
};

export const interpolateSkyboxPalette = (phase: number): PaletteState => {
  const weights = getSkyboxPhaseWeights(phase);
  return {
    zenith: mixColor(weights, (state) => state.zenith),
    horizon: mixColor(weights, (state) => state.horizon),
    glow: mixColor(weights, (state) => state.glow),
    haze: mixColor(weights, (state) => state.haze),
    silhouette: mixColor(weights, (state) => state.silhouette),
    aurora: mixColor(weights, (state) => state.aurora)
  };
};

const toCss = (color: Rgb, alpha = 1): string =>
  `rgba(${Math.round(clamp(color[0], 0, 255))}, ${Math.round(clamp(color[1], 0, 255))}, ${Math.round(clamp(color[2], 0, 255))}, ${clamp(alpha, 0, 1)})`;

const quantize = (color: Rgb, levels: number): Rgb => {
  if (levels <= 2) {
    return color;
  }
  return color.map((channel) => {
    const normalized = clamp(channel / 255, 0, 1);
    return Math.round(Math.round(normalized * (levels - 1)) / (levels - 1) * 255);
  }) as Rgb;
};

const adjustColor = (color: Rgb, saturation: number, exposure: number): Rgb => {
  const avg = (color[0] + color[1] + color[2]) / 3;
  return [
    clamp((avg + (color[0] - avg) * saturation) * exposure, 0, 255),
    clamp((avg + (color[1] - avg) * saturation) * exposure, 0, 255),
    clamp((avg + (color[2] - avg) * saturation) * exposure, 0, 255)
  ];
};

const buildStars = (count: number): StarPoint[] =>
  Array.from({ length: count }, (_, index) => ({
    x: hash(index * 1.91 + 9.2),
    y: hash(index * 2.57 + 13.1),
    size: lerp(0.35, 1.85, hash(index * 4.13 + 91.7)),
    twinkle: lerp(0.8, 1.4, hash(index * 7.41 + 53.2))
  }));

const buildRidges = (segments: number, seed: number, amplitude: number): RidgePoint[] =>
  Array.from({ length: segments + 1 }, (_, index) => ({
    x: index / segments,
    y: (hash(seed + index * 0.97) - 0.5) * amplitude
  }));

const drawCloudBand = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  time: number,
  layer: number,
  amount: number,
  phase: number,
  color: Rgb,
  bassPulse: number
): void => {
  const bandY = lerp(0.22, 0.78, layer / 4) * horizonY;
  const thickness = height * lerp(0.06, 0.13, layer / 4);
  const drift = time * (0.008 + layer * 0.004);
  const offset = (drift * width * 0.18 + phase * width * (0.03 + layer * 0.01)) % width;
  const gradient = ctx.createLinearGradient(0, bandY - thickness, 0, bandY + thickness);
  gradient.addColorStop(0, toCss(color, 0));
  gradient.addColorStop(0.5, toCss(color, amount * (0.12 + bassPulse * 0.08)));
  gradient.addColorStop(1, toCss(color, 0));

  ctx.save();
  ctx.translate(-offset, 0);
  ctx.fillStyle = gradient;
  for (let i = -1; i < 3; i += 1) {
    const centerX = (i + 0.5) * width;
    ctx.beginPath();
    ctx.ellipse(centerX, bandY + Math.sin(drift + i + layer) * thickness * 0.22, width * 0.6, thickness, 0, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
};

const drawSilhouetteBand = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  ridges: RidgePoint[],
  amount: number,
  color: Rgb,
  parallax: number,
  time: number
): void => {
  const baseY = horizonY + height * 0.02 + parallax * height * 0.05;
  const drift = Math.sin(time * (0.03 + parallax * 0.02)) * width * 0.03;
  ctx.fillStyle = toCss(color, amount * (0.35 + parallax * 0.25));
  ctx.beginPath();
  ctx.moveTo(-width * 0.12, height);
  ridges.forEach((point, index) => {
    const x = point.x * width + drift;
    const y = baseY - point.y * height - Math.sin(index * 0.5 + time * 0.05) * parallax * 2;
    ctx.lineTo(x, y);
  });
  ctx.lineTo(width * 1.12, height);
  ctx.closePath();
  ctx.fill();
};

const drawStars = (
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  stars: StarPoint[],
  visibility: number,
  time: number,
  trebleLift: number
): void => {
  if (visibility <= 0.001) {
    return;
  }
  ctx.fillStyle = "#ffffff";
  for (const star of stars) {
    const x = star.x * width;
    const y = star.y * (horizonY - 4);
    const twinkle = 0.6 + Math.sin(time * star.twinkle + star.x * 20) * 0.4;
    const alpha = visibility * (0.35 + twinkle * 0.5 + trebleLift * 0.25);
    ctx.globalAlpha = clamp(alpha, 0, 0.9);
    const size = star.size * (0.7 + trebleLift * 0.2);
    ctx.fillRect(x, y, size, size);
  }
  ctx.globalAlpha = 1;
};

const drawAurora = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  horizonY: number,
  color: Rgb,
  surrealness: number,
  phase: number,
  time: number
): void => {
  const strength = surrealness * softStep(0.62, 1, phase);
  if (strength <= 0.01) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const ribbons = 3;
  for (let i = 0; i < ribbons; i += 1) {
    const x = width * (0.18 + i * 0.27 + Math.sin(time * 0.08 + i * 1.3) * 0.06);
    const y = horizonY * (0.3 + i * 0.08);
    const ribbon = ctx.createRadialGradient(x, y, 0, x, y, height * (0.45 + i * 0.08));
    ribbon.addColorStop(0, toCss(color, strength * (0.12 + i * 0.03)));
    ribbon.addColorStop(1, toCss(color, 0));
    ctx.fillStyle = ribbon;
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.35, height * (0.14 + i * 0.02), Math.sin(time * 0.12 + i) * 0.3, 0, TWO_PI);
    ctx.fill();
  }
  ctx.restore();
};

export class SkyboxTransitionEffect implements Effect {
  private stars: StarPoint[] = [];
  private ridgesNear: RidgePoint[] = [];
  private ridgesFar: RidgePoint[] = [];

  reset(): void {
    this.stars = [];
    this.ridgesNear = [];
    this.ridgesFar = [];
  }

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    const speed = clamp(resolveNumber(params.speed, SKYBOX_TRANSITION_DEFAULTS.speed), 0.05, 3);
    const intensity = clamp(resolveNumber(params.intensity, SKYBOX_TRANSITION_DEFAULTS.intensity), 0.3, 1.8);
    const horizon = clamp(resolveNumber(params.horizon, SKYBOX_TRANSITION_DEFAULTS.horizon), 0.3, 0.85);
    const cloudAmount = clamp(resolveNumber(params.cloudAmount, SKYBOX_TRANSITION_DEFAULTS.cloudAmount), 0, 1.2);
    const starAmount = clamp(resolveNumber(params.starAmount, SKYBOX_TRANSITION_DEFAULTS.starAmount), 0, 1.2);
    const silhouetteAmount = clamp(resolveNumber(params.silhouetteAmount, SKYBOX_TRANSITION_DEFAULTS.silhouetteAmount), 0, 1.2);
    const surrealness = clamp(resolveNumber(params.surrealness, SKYBOX_TRANSITION_DEFAULTS.surrealness), 0, 1.4);
    const audioReactive = clamp(resolveNumber(params.audioReactive, SKYBOX_TRANSITION_DEFAULTS.audioReactive), 0, 1);
    const loop = resolveBoolean(params.loop, SKYBOX_TRANSITION_DEFAULTS.loop);
    const phaseOffset = resolveNumber(params.phaseOffset, SKYBOX_TRANSITION_DEFAULTS.phaseOffset);

    const phase = getSkyboxPhase(time, speed, loop, phaseOffset);
    const palette = interpolateSkyboxPalette(phase);

    const eraKey = (era ?? "").toLowerCase();
    const eraQuantize = eraKey === "8bit" ? 12 : eraKey === "16bit" ? 20 : 0;
    const eraSoftness = eraKey === "8bit" ? 0.85 : eraKey === "16bit" ? 0.92 : 1;
    const eraSurrealBoost = eraKey === "future" ? 1.35 : eraKey === "pcdemo" || eraKey === "ps1" ? 1.1 : 0.92;

    const beatBoost = audio.beat ? audio.beatStrength : 0;
    const bassPulse = audio.bass * audioReactive;
    const trebleLift = audio.treble * audioReactive;
    const rmsGlow = audio.rms * audioReactive;

    const saturation = intensity * (0.92 + rmsGlow * 0.25);
    const exposure = 0.95 + intensity * 0.15 + beatBoost * 0.05;

    const zenithColor = adjustColor(palette.zenith, saturation, exposure);
    const horizonColor = adjustColor(palette.horizon, saturation, exposure);
    const glowColor = adjustColor(palette.glow, saturation * 1.05, exposure);
    const hazeColor = adjustColor(palette.haze, saturation, exposure);
    const silhouetteColor = adjustColor(palette.silhouette, 1, 0.9 + intensity * 0.08);
    const auroraColor = adjustColor(palette.aurora, saturation * 1.1, exposure);

    const appliedZenith = eraQuantize > 0 ? quantize(zenithColor, eraQuantize) : zenithColor;
    const appliedHorizon = eraQuantize > 0 ? quantize(horizonColor, eraQuantize) : horizonColor;
    const appliedGlow = eraQuantize > 0 ? quantize(glowColor, eraQuantize) : glowColor;

    const horizonY = height * horizon;

    if (this.stars.length === 0) {
      this.stars = buildStars(220);
    }
    if (this.ridgesNear.length === 0 || this.ridgesFar.length === 0) {
      this.ridgesFar = buildRidges(16, 49.7, 0.08);
      this.ridgesNear = buildRidges(24, 108.2, 0.12);
    }

    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, toCss(appliedZenith));
    skyGradient.addColorStop(1, toCss(appliedHorizon));
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    const glow = ctx.createRadialGradient(width * 0.5, horizonY, width * 0.1, width * 0.5, horizonY, Math.max(width, height) * 0.7);
    const glowAlpha = (0.22 + (1 - phase) * 0.08 + rmsGlow * 0.12) * eraSoftness;
    glow.addColorStop(0, toCss(appliedGlow, glowAlpha));
    glow.addColorStop(1, toCss(appliedGlow, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    const hazeGradient = ctx.createLinearGradient(0, horizonY - height * 0.16, 0, horizonY + height * 0.08);
    hazeGradient.addColorStop(0, toCss(hazeColor, 0));
    hazeGradient.addColorStop(0.6, toCss(hazeColor, 0.1 + bassPulse * 0.08));
    hazeGradient.addColorStop(1, toCss(hazeColor, 0));
    ctx.fillStyle = hazeGradient;
    ctx.fillRect(0, horizonY - height * 0.2, width, height * 0.3);

    for (let layer = 0; layer < 4; layer += 1) {
      drawCloudBand(ctx, width, height, horizonY, time, layer, cloudAmount * eraSoftness, phase, hazeColor, bassPulse);
    }

    const starVisibility = starAmount * softStep(0.48, 1, phase) * (0.75 + eraSurrealBoost * 0.15);
    drawStars(ctx, width, horizonY, this.stars, starVisibility, time, trebleLift);

    drawSilhouetteBand(ctx, width, height, horizonY, this.ridgesFar, silhouetteAmount * 0.9, silhouetteColor, 0.35, time);
    drawSilhouetteBand(ctx, width, height, horizonY, this.ridgesNear, silhouetteAmount, silhouetteColor, 0.7, time);

    drawAurora(ctx, width, height, horizonY, auroraColor, surrealness * eraSurrealBoost, phase, time);

    const groundGradient = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGradient.addColorStop(0, toCss(silhouetteColor, 0.66));
    groundGradient.addColorStop(1, toCss(silhouetteColor, 0.96));
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, horizonY, width, height - horizonY);
  }
}
