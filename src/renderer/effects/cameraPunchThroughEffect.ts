import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const CAMERA_PUNCH_THROUGH_DEFAULTS = {
  speed: 1.2,
  fov: 1.15,
  blur: 0.82,
  depthFade: 0.72,
  streaks: 1,
  seed: 9
} as const;

const TAU = Math.PI * 2;

const hash01 = (n: number): number => {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export class CameraPunchThroughEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = clamp(params.speed ?? CAMERA_PUNCH_THROUGH_DEFAULTS.speed, 0.2, 4);
    const fov = clamp(params.fov ?? CAMERA_PUNCH_THROUGH_DEFAULTS.fov, 0.5, 2.5);
    const blur = clamp(params.blur ?? CAMERA_PUNCH_THROUGH_DEFAULTS.blur, 0, 0.97);
    const depthFade = clamp(params.depthFade ?? CAMERA_PUNCH_THROUGH_DEFAULTS.depthFade, 0.2, 0.98);
    const streakDensity = clamp(params.streaks ?? CAMERA_PUNCH_THROUGH_DEFAULTS.streaks, 0.3, 2.4);
    const seed = Math.round(params.seed ?? CAMERA_PUNCH_THROUGH_DEFAULTS.seed);

    const bass = clamp(audio.bass ?? 0, 0, 1);
    const treble = clamp(audio.treble ?? 0, 0, 1);
    const beatBoost = clamp(audio.beatStrength ?? 0, 0, 1);

    const progress = (time * speed) % 1;
    const ramp = Math.pow(progress, 1.45);
    const minDim = Math.min(width, height);
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    ctx.fillStyle = `rgba(0, 0, 0, ${1 - blur})`;
    ctx.fillRect(0, 0, width, height);

    const streakCount = Math.round(140 * streakDensity);
    const ringCount = Math.round(30 + streakDensity * 16);

    ctx.lineWidth = 1 + ramp * (2.8 + bass * 2.2);
    for (let i = 0; i < streakCount; i += 1) {
      const n = i + seed * 97;
      const angle = hash01(n) * TAU + time * (0.12 + treble * 0.3);
      const radial = Math.pow(hash01(n + 11.23), 1.2);
      const z = (hash01(n + 2.73) + progress) % 1;
      const depth = 1 - z;
      const fovPush = 1 + ramp * fov * 3.2;
      const startR = minDim * 0.02 * fovPush;
      const endR = (minDim * (0.1 + radial * 0.55) * fovPush) / Math.max(0.05, depth);
      const x0 = centerX + Math.cos(angle) * startR;
      const y0 = centerY + Math.sin(angle) * startR;
      const x1 = centerX + Math.cos(angle) * endR;
      const y1 = centerY + Math.sin(angle) * endR;
      const alpha = clamp((depth * depth + beatBoost * 0.2) * (0.18 + treble * 0.42), 0.05, 0.9);

      ctx.strokeStyle = `rgba(${120 + Math.round(95 * depth)}, ${190 + Math.round(45 * bass)}, 255, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    for (let i = 0; i < ringCount; i += 1) {
      const depth = (i + progress * ringCount) / ringCount;
      const perspective = 1 / Math.max(0.08, 1 - depth);
      const radius = (minDim * (0.05 + depth * 0.07) * (1 + ramp * 2.1 * fov)) * perspective;
      const alpha = clamp((1 - depth) * 0.2 + beatBoost * 0.1, 0.03, 0.32);
      ctx.strokeStyle = `rgba(180, 240, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, TAU);
      ctx.stroke();
    }

    const holeRadius = minDim * (0.12 + Math.pow(ramp, 0.55) * (1.8 + fov * 0.9));
    const holeGradient = ctx.createRadialGradient(centerX, centerY, holeRadius * 0.12, centerX, centerY, holeRadius);
    holeGradient.addColorStop(0, "rgba(255,255,255,0.95)");
    holeGradient.addColorStop(0.35, "rgba(150,220,255,0.6)");
    holeGradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = holeGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, holeRadius, 0, TAU);
    ctx.fill();

    const depthAlpha = clamp((progress - depthFade) / Math.max(0.01, 1 - depthFade), 0, 1);
    if (depthAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(depthAlpha, 0.4)})`;
      ctx.fillRect(0, 0, width, height);
    }
  }
}
