import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Audio-reactive fireworks display with deterministic shell timing, ember launch points, multiring bursts, and glitter tails.
 */
export const FIREWORKS_DISPLAY_DEFAULTS = {
  shellRate: 0.55,
  burstSize: 0.78,
  glitter: 0.62,
  trail: 0.28,
  gravity: 0.58,
  hueShift: 0,
  audioReact: 0.7,
  launchSpread: 0.82,
  seed: 0
} as const;

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const fireworksHash01 = (value: number): number => {
  const hashed = Math.sin(value * 12.9898 + 78.233) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const fireworksPalette = (baseHue: number, paletteIndex: number): { core: string; spark: string; smoke: string } => {
  const hue = (baseHue + paletteIndex * 47.5) % 360;
  return {
    core: `hsla(${hue}, 96%, 68%, 0.95)`,
    spark: `hsla(${(hue + 18) % 360}, 98%, 76%, 0.9)`,
    smoke: `hsla(${(hue + 210) % 360}, 24%, 70%, 0.14)`
  };
};

export type FireworksLaunchState = {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  tailStartX: number;
  tailStartY: number;
  headRadius: number;
  tailLength: number;
  sparkCount: number;
  glowAlpha: number;
};

export const computeFireworksLaunchState = ({
  width,
  height,
  launchX,
  baseY,
  apexY,
  shellSeed,
  launchProgress,
  energy
}: {
  width: number;
  height: number;
  launchX: number;
  baseY: number;
  apexY: number;
  shellSeed: number;
  launchProgress: number;
  energy: number;
}): FireworksLaunchState => {
  const clampedProgress = clamp(launchProgress, 0, 1);
  const eased = 1 - (1 - clampedProgress) * (1 - clampedProgress);
  const prevProgress = Math.max(0, clampedProgress - 0.03);
  const prevEased = 1 - (1 - prevProgress) * (1 - prevProgress);
  const wobble = (fireworksHash01(shellSeed + 5.1) - 0.5) * width * 0.025;
  const curve = Math.sin(clampedProgress * Math.PI) * wobble;
  const prevCurve = Math.sin(prevProgress * Math.PI) * wobble;
  const x = launchX + curve * (1 - clampedProgress * 0.35);
  const prevX = launchX + prevCurve * (1 - prevProgress * 0.35);
  const y = baseY - (baseY - apexY) * eased;
  const prevY = baseY - (baseY - apexY) * prevEased;
  const dx = x - prevX;
  const dy = y - prevY;
  const directionLength = Math.hypot(dx, dy) || 1;
  const tailLength = 8 + energy * 8 + (1 - clampedProgress) * Math.min(height, width) * 0.018;
  const tailStartX = x - (dx / directionLength) * tailLength;
  const tailStartY = y - (dy / directionLength) * tailLength;

  return {
    x,
    y,
    prevX,
    prevY,
    tailStartX,
    tailStartY,
    headRadius: 1.5 + energy * 1.15,
    tailLength,
    sparkCount: 3 + Math.round(energy * 4),
    glowAlpha: 0.32 + energy * 0.22
  };
};

export class FireworksDisplayEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const shellRate = clamp(resolveNumberParam(rawParams.shellRate, FIREWORKS_DISPLAY_DEFAULTS.shellRate), 0.1, 1.5);
    const burstSize = clamp(resolveNumberParam(rawParams.burstSize, FIREWORKS_DISPLAY_DEFAULTS.burstSize), 0.2, 1.4);
    const glitter = clamp(resolveNumberParam(rawParams.glitter, FIREWORKS_DISPLAY_DEFAULTS.glitter), 0, 1);
    const trail = clamp(resolveNumberParam(rawParams.trail, FIREWORKS_DISPLAY_DEFAULTS.trail), 0, 0.92);
    const gravity = clamp(resolveNumberParam(rawParams.gravity, FIREWORKS_DISPLAY_DEFAULTS.gravity), 0.1, 1.2);
    const hueShift = resolveNumberParam(rawParams.hueShift, FIREWORKS_DISPLAY_DEFAULTS.hueShift);
    const audioReact = clamp(resolveNumberParam(rawParams.audioReact, FIREWORKS_DISPLAY_DEFAULTS.audioReact), 0, 1);
    const launchSpread = clamp(resolveNumberParam(rawParams.launchSpread, FIREWORKS_DISPLAY_DEFAULTS.launchSpread), 0.2, 1);
    const seed = resolveNumberParam(rawParams.seed, FIREWORKS_DISPLAY_DEFAULTS.seed);

    ctx.fillStyle = `rgba(2, 4, 12, ${0.08 + trail * 0.55})`;
    ctx.fillRect(0, 0, width, height);

    const beatPulse = audio.beat ? 1 : 0;
    const audioEnergy = audio.rms * 0.7 + audio.treble * 0.25 + beatPulse * 0.45;
    const energy = clamp((1 - audioReact) * 0.55 + audioEnergy * audioReact, 0, 1.5);
    const shellCount = Math.max(4, Math.floor(7 + shellRate * 15 + energy * 6));
    const cycleDuration = 1.9 / shellRate;
    const launchWindow = 0.33;

    for (let shellIndex = 0; shellIndex < shellCount; shellIndex += 1) {
      const shellSeed = seed * 1000 + shellIndex * 91.731;
      const launchOffset = fireworksHash01(shellSeed + 2.1) * cycleDuration;
      const localTime = (time + launchOffset) % cycleDuration;
      const phase = localTime / cycleDuration;
      const launchXBase = fireworksHash01(shellSeed + 13.37);
      const launchX = width * (0.1 + launchXBase * 0.8 * launchSpread + (1 - launchSpread) * 0.4);
      const apexY = height * (0.14 + fireworksHash01(shellSeed + 8.8) * 0.38);
      const baseY = height * 1.04;
      const palette = fireworksPalette((210 + hueShift + shellIndex * 9) % 360, shellIndex);
      const flicker = 0.85 + fireworksHash01(shellSeed + Math.floor(time * 30)) * 0.3;

      if (phase < launchWindow) {
        const launchProgress = phase / launchWindow;
        const launchState = computeFireworksLaunchState({
          width,
          height,
          launchX,
          baseY,
          apexY,
          shellSeed,
          launchProgress,
          energy
        });

        ctx.globalCompositeOperation = "lighter";
        ctx.strokeStyle = `hsla(${(24 + hueShift + shellIndex * 6) % 360}, 92%, 54%, ${0.3 + launchState.glowAlpha * 0.45})`;
        ctx.lineWidth = 0.8 + energy * 0.35;
        ctx.beginPath();
        ctx.moveTo(launchState.tailStartX, launchState.tailStartY);
        ctx.lineTo(launchState.prevX, launchState.prevY);
        ctx.stroke();

        const gradient = ctx.createLinearGradient(
          launchState.tailStartX,
          launchState.tailStartY,
          launchState.x,
          launchState.y
        );
        gradient.addColorStop(0, `hsla(${(18 + hueShift + shellIndex * 5) % 360}, 88%, 28%, 0)`);
        gradient.addColorStop(0.35, `hsla(${(22 + hueShift + shellIndex * 5) % 360}, 95%, 36%, 0.18)`);
        gradient.addColorStop(1, `hsla(${(38 + hueShift + shellIndex * 5) % 360}, 100%, 78%, ${0.88 + energy * 0.08})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + energy * 0.5;
        ctx.beginPath();
        ctx.moveTo(launchState.tailStartX, launchState.tailStartY);
        ctx.lineTo(launchState.x, launchState.y);
        ctx.stroke();

        ctx.fillStyle = `hsla(${(24 + hueShift + shellIndex * 5) % 360}, 100%, 50%, ${0.2 + energy * 0.08})`;
        ctx.beginPath();
        ctx.arc(launchState.x, launchState.y, launchState.headRadius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        for (let sparkIndex = 0; sparkIndex < launchState.sparkCount; sparkIndex += 1) {
          const sparkSeed = shellSeed + sparkIndex * 9.7 + Math.floor(time * 48);
          const sparkT = fireworksHash01(sparkSeed + 1.7);
          const jitter = (fireworksHash01(sparkSeed + 3.3) - 0.5) * launchState.tailLength * 0.16;
          const sparkX = launchState.x + (launchState.tailStartX - launchState.x) * sparkT + jitter;
          const sparkY = launchState.y + (launchState.tailStartY - launchState.y) * sparkT;
          const sparkAlpha = (0.16 + (1 - sparkT) * 0.34) * flicker;
          const sparkRadius = 0.45 + (1 - sparkT) * 0.8 + energy * 0.15;
          ctx.fillStyle = `hsla(${(28 + hueShift + shellIndex * 5) % 360}, 100%, ${42 + (1 - sparkT) * 24}%, ${sparkAlpha})`;
          ctx.beginPath();
          ctx.arc(sparkX, sparkY, sparkRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `hsla(${(46 + hueShift + shellIndex * 5) % 360}, 100%, 79%, ${0.76 + energy * 0.18})`;
        ctx.beginPath();
        ctx.arc(launchState.x, launchState.y, launchState.headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        continue;
      }

      const explodeProgress = clamp((phase - launchWindow) / (1 - launchWindow), 0, 1);
      const fade = 1 - explodeProgress;
      if (fade <= 0) {
        continue;
      }

      const radius = (20 + width * 0.09 * burstSize + energy * 42) * Math.sqrt(explodeProgress);
      const coreRadius = 5 + radius * 0.18;

      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = palette.smoke;
      ctx.beginPath();
      ctx.arc(launchX, apexY, radius * 0.92, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${(30 + hueShift + shellIndex * 4) % 360}, 100%, 72%, ${0.24 * fade})`;
      ctx.beginPath();
      ctx.arc(launchX, apexY, coreRadius * (0.9 + energy * 0.4), 0, Math.PI * 2);
      ctx.fill();

      const spokes = Math.floor(36 + burstSize * 44 + energy * 22);
      ctx.strokeStyle = palette.core;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i < spokes; i += 1) {
        const particleSeed = shellSeed + i * 17.17;
        const angle = (i / spokes) * Math.PI * 2 + fireworksHash01(particleSeed + 7.7) * 0.14;
        const velocity = radius * (0.72 + fireworksHash01(particleSeed + 1.7) * 0.62);
        const gravityDrop = explodeProgress * explodeProgress * gravity * height * 0.16;
        const px = launchX + Math.cos(angle) * velocity;
        const py = apexY + Math.sin(angle) * velocity + gravityDrop;
        const tail = 6 + fireworksHash01(particleSeed + 2.4) * 18 * fade;

        ctx.moveTo(px - Math.cos(angle) * tail, py - Math.sin(angle) * tail);
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      const glitterCount = Math.floor(glitter * 70 + energy * 20);
      ctx.fillStyle = `hsla(${(52 + hueShift + shellIndex * 11) % 360}, 100%, 85%, ${0.3 + 0.5 * fade})`;
      for (let i = 0; i < glitterCount; i += 1) {
        const glitterSeed = shellSeed + i * 3.13 + 100;
        const angle = fireworksHash01(glitterSeed) * Math.PI * 2;
        const r = radius * (0.2 + fireworksHash01(glitterSeed + 1.2));
        const gx = launchX + Math.cos(angle) * r;
        const gy = apexY + Math.sin(angle) * r + explodeProgress * gravity * height * 0.09;
        const size = (0.6 + fireworksHash01(glitterSeed + 4.8) * 1.7) * fade * flicker;
        ctx.beginPath();
        ctx.arc(gx, gy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
    }
  }
}
