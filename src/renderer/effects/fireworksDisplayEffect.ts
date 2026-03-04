import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Audio-reactive fireworks display with deterministic shell timing, multiring bursts, and glitter tails.
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
    const energy = clamp(audio.rms * 0.7 + audio.treble * 0.25 + beatPulse * 0.45, 0, 1.5);
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
        const eased = 1 - (1 - launchProgress) * (1 - launchProgress);
        const y = baseY - (baseY - apexY) * eased;
        const wobble = (fireworksHash01(shellSeed + 5.1) - 0.5) * width * 0.025;
        const x = launchX + wobble * (1 - launchProgress);

        ctx.strokeStyle = palette.spark;
        ctx.lineWidth = 1.2 + energy * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = `hsla(${(48 + hueShift + shellIndex * 5) % 360}, 100%, 78%, ${0.72 + energy * 0.2})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.3 + energy * 1.1, 0, Math.PI * 2);
        ctx.fill();
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
