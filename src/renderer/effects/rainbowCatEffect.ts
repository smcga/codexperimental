import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Cheerful synth-night rainbow cat with a clearer cat silhouette, drifting starfield, and an audio-reactive rainbow trail.
 */
export const RAINBOW_CAT_DEFAULTS = {
  speed: 0.9,
  rainbowLength: 0.72,
  bounce: 0.45,
  sparkle: 0.6,
  trailAlpha: 0.82,
  catScale: 1,
  starDensity: 0.65,
  seed: 0
} as const;

const RAINBOW_TRAIL_COLORS = ["#ff4f8b", "#ff8a3d", "#ffd84d", "#52e36d", "#53c9ff", "#8a68ff"] as const;

const CAT_OUTLINE = "#30203f";
const CAT_FUR = "#aab0c0";
const CAT_FUR_SHADE = "#7c8498";
const CAT_BELLY = "#d7dce8";
const CAT_NOSE = "#ff88bb";
const CAT_CHEEK = "#ffb3d7";
const CAT_EYE = "#181525";
const NIGHT_SKY = "#080b1c";
const HORIZON_GLOW = "#18224b";
const MOON_GLOW = "rgba(138, 180, 255, 0.12)";

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const rainbowCatHash01 = (value: number): number => {
  const hashed = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export const computeRainbowCatPosition = ({
  width,
  height,
  time,
  speed,
  bounce,
  catScale,
  audioLift,
  seed = 0
}: {
  width: number;
  height: number;
  time: number;
  speed: number;
  bounce: number;
  catScale: number;
  audioLift: number;
  seed?: number;
}): { x: number; y: number; bob: number; pixelSize: number } => {
  const pixelSize = Math.max(2, Math.min(width, height) * 0.0075 * catScale);
  const phase = seed * 0.17;
  const orbitX = Math.sin(time * (0.34 + speed * 0.08) + phase) * width * 0.18;
  const meanderX = Math.sin(time * (0.13 + speed * 0.03) + phase * 1.9) * width * 0.1;
  const floatY = Math.sin(time * (1.9 + speed * 0.3) + phase * 0.7) * height * (0.075 + bounce * 0.05);
  const flutterY = Math.sin(time * (4.8 + speed * 0.75) + phase * 2.4) * height * (0.02 + bounce * 0.015);
  const audioBob = Math.sin(time * 7.5 + phase * 0.5) * audioLift * height * 0.035;
  const bob = floatY + flutterY + audioBob;

  return {
    x: width * 0.5 + orbitX + meanderX,
    y: height * 0.48 + bob,
    bob,
    pixelSize
  };
};

const fillGridRect = (
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gridX: number,
  gridY: number,
  gridW: number,
  gridH: number,
  pixelSize: number,
  color: string
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(originX + gridX * pixelSize, originY + gridY * pixelSize, gridW * pixelSize, gridH * pixelSize);
};

const drawRainbowTrail = ({
  ctx,
  time,
  catX,
  catY,
  pixelSize,
  rainbowLength,
  bounce,
  trailAlpha,
  sparkle,
  movingRight
}: {
  ctx: CanvasRenderingContext2D;
  time: number;
  catX: number;
  catY: number;
  pixelSize: number;
  rainbowLength: number;
  bounce: number;
  trailAlpha: number;
  sparkle: number;
  movingRight: boolean;
}): void => {
  const segmentCount = Math.max(10, Math.floor(12 + rainbowLength * 26));
  const segmentWidth = pixelSize * 3.6;
  const stripeHeight = pixelSize * 1.4;
  const direction = movingRight ? -1 : 1;
  const anchorX = catX + direction * pixelSize * 3;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = clamp(trailAlpha, 0.05, 1);

  for (let stripeIndex = 0; stripeIndex < RAINBOW_TRAIL_COLORS.length; stripeIndex += 1) {
    const color = RAINBOW_TRAIL_COLORS[stripeIndex];
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      const wave = Math.sin(time * 6.5 + segmentIndex * 0.42 + stripeIndex * 0.7);
      const flutter = Math.sin(time * 3.3 + segmentIndex * 0.16 + stripeIndex * 0.33);
      const x = anchorX + direction * segmentIndex * segmentWidth;
      const y = catY - pixelSize * 1.9 + stripeIndex * stripeHeight + (wave * 0.75 + flutter * 0.35) * bounce * pixelSize;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, segmentWidth + pixelSize * 0.8, stripeHeight + pixelSize * 0.15);

      if (sparkle > 0.02 && segmentIndex % 4 === stripeIndex % 4) {
        ctx.fillStyle = `rgba(255,255,255,${0.06 + sparkle * 0.18})`;
        ctx.fillRect(x + direction * segmentWidth * 0.35, y + stripeHeight * 0.18, pixelSize, pixelSize);
      }
    }
  }

  ctx.restore();
};

const drawStarfield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  speed: number,
  sparkle: number,
  starDensity: number,
  seed: number
): void => {
  const starCount = Math.max(10, Math.floor(14 + starDensity * 34));
  for (let index = 0; index < starCount; index += 1) {
    const starSeed = seed * 1000 + index * 17.17;
    const xBase = rainbowCatHash01(starSeed + 1.1) * width;
    const yBase = rainbowCatHash01(starSeed + 2.2) * height * 0.82;
    const drift = (time * (12 + speed * 8) * (0.25 + rainbowCatHash01(starSeed + 3.7))) % (width + 24);
    const x = (xBase - drift + width + 24) % (width + 24) - 12;
    const y = yBase + Math.sin(time * 1.8 + starSeed) * 3.2;
    const twinkle = 0.45 + 0.55 * Math.sin(time * (5.5 + sparkle * 2) + starSeed * 0.4);
    const size = 1 + rainbowCatHash01(starSeed + 4.4) * (1.2 + sparkle * 2.4);
    const alpha = 0.22 + twinkle * (0.22 + sparkle * 0.4);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, size, size);

    if (twinkle > 0.72) {
      ctx.fillRect(x - size, y + size * 0.35, size * 3, Math.max(1, size * 0.35));
      ctx.fillRect(x + size * 0.35, y - size, Math.max(1, size * 0.35), size * 3);
    }
  }
};

const drawRainbowCat = ({
  ctx,
  x,
  y,
  pixelSize,
  beatPulse,
  movingRight,
  tailSwing,
  stridePhase
}: {
  ctx: CanvasRenderingContext2D;
  x: number;
  y: number;
  pixelSize: number;
  beatPulse: number;
  movingRight: boolean;
  tailSwing: number;
  stridePhase: number;
}): void => {
  const dir = movingRight ? 1 : -1;
  const originX = x - pixelSize * 8;
  const originY = y - pixelSize * 6;
  const rearLegLift = Math.max(0, Math.sin(stridePhase)) * (0.6 + beatPulse * 0.35);
  const frontLegLift = Math.max(0, Math.sin(stridePhase + Math.PI)) * (0.6 + beatPulse * 0.35);

  fillGridRect(ctx, originX, originY, 2, 5, 7, 4, pixelSize, CAT_FUR_SHADE);
  fillGridRect(ctx, originX, originY, 3, 4, 6, 4, pixelSize, CAT_FUR);
  fillGridRect(ctx, originX, originY, 4, 5, 3, 2, pixelSize, CAT_BELLY);
  fillGridRect(ctx, originX, originY, 2, 5, 1, 3, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 8, 4, 1, 4, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 3, 4, 5, 1, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 3, 8, 5, 1, pixelSize, CAT_OUTLINE);

  fillGridRect(ctx, originX, originY, 8.5, 2.3, 4, 4, pixelSize, CAT_FUR_SHADE);
  fillGridRect(ctx, originX, originY, 9, 2.8, 3.1, 3.1, pixelSize, CAT_FUR);
  fillGridRect(ctx, originX, originY, 9.2, 4.3, 1.6, 1.1, pixelSize, CAT_BELLY);
  fillGridRect(ctx, originX, originY, 11.2, 4.3, 0.9, 1.1, pixelSize, CAT_BELLY);
  fillGridRect(ctx, originX, originY, 9, 1.2, 1, 1.4, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 11.3, 1.2, 1, 1.4, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 9.2, 1.6, 0.8, 1, pixelSize, CAT_FUR);
  fillGridRect(ctx, originX, originY, 11.3, 1.6, 0.8, 1, pixelSize, CAT_FUR);

  fillGridRect(ctx, originX, originY, 9.65, 3.5, 0.5, 0.55, pixelSize, CAT_EYE);
  fillGridRect(ctx, originX, originY, 11.05, 3.5, 0.5, 0.55, pixelSize, CAT_EYE);
  fillGridRect(ctx, originX, originY, 10.35, 4.2, 0.6, 0.45, pixelSize, CAT_NOSE);
  fillGridRect(ctx, originX, originY, 9.35, 4.55, 0.8, 0.6, pixelSize, CAT_CHEEK);
  fillGridRect(ctx, originX, originY, 11.05, 4.55, 0.8, 0.6, pixelSize, CAT_CHEEK);
  fillGridRect(ctx, originX, originY, 10.35, 4.7, 0.08, 0.8, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 10.85, 4.7, 0.08, 0.8, pixelSize, CAT_OUTLINE);

  fillGridRect(ctx, originX, originY, 3.3, 8.1 - rearLegLift, 1, 2.1, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 5.3, 8.6 - frontLegLift * 0.35, 1, 2.1, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 6.8, 8.1 - frontLegLift, 1, 2.1, pixelSize, CAT_OUTLINE);
  fillGridRect(ctx, originX, originY, 8.4, 8.6 - rearLegLift * 0.35, 1, 2.1, pixelSize, CAT_OUTLINE);

  ctx.strokeStyle = CAT_OUTLINE;
  ctx.lineWidth = Math.max(1.1, pixelSize * 0.42);
  ctx.lineCap = "round";

  const tailBaseX = originX + pixelSize * 2.4;
  const tailBaseY = originY + pixelSize * 6.4;
  const tailTipX = tailBaseX - dir * pixelSize * (4.2 + tailSwing * 0.6);
  const tailTipY = tailBaseY - pixelSize * (2.8 + tailSwing * 1.4);
  ctx.beginPath();
  ctx.moveTo(tailBaseX, tailBaseY);
  ctx.quadraticCurveTo(
    tailBaseX - dir * pixelSize * (2.2 + tailSwing * 0.6),
    tailBaseY - pixelSize * (3.4 + tailSwing * 0.9),
    tailTipX,
    tailTipY
  );
  ctx.stroke();

  const whiskerStartX = originX + pixelSize * 10.5;
  const whiskerStartY = originY + pixelSize * 4.55;
  const whiskerDirection = dir;
  [-0.65, 0, 0.65].forEach((offset) => {
    ctx.beginPath();
    ctx.moveTo(whiskerStartX, whiskerStartY + offset * pixelSize);
    ctx.lineTo(whiskerStartX + whiskerDirection * pixelSize * 2.4, whiskerStartY + offset * pixelSize * 1.2);
    ctx.stroke();
  });
};

export class RainbowCatEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const speed = clamp(resolveNumberParam(rawParams.speed, RAINBOW_CAT_DEFAULTS.speed), 0.2, 2.5);
    const rainbowLength = clamp(
      resolveNumberParam(rawParams.rainbowLength, RAINBOW_CAT_DEFAULTS.rainbowLength),
      0.2,
      1
    );
    const bounce = clamp(resolveNumberParam(rawParams.bounce, RAINBOW_CAT_DEFAULTS.bounce), 0, 1.2);
    const sparkle = clamp(resolveNumberParam(rawParams.sparkle, RAINBOW_CAT_DEFAULTS.sparkle), 0, 1);
    const trailAlpha = clamp(resolveNumberParam(rawParams.trailAlpha, RAINBOW_CAT_DEFAULTS.trailAlpha), 0.1, 1);
    const catScale = clamp(resolveNumberParam(rawParams.catScale, RAINBOW_CAT_DEFAULTS.catScale), 0.6, 1.8);
    const starDensity = clamp(resolveNumberParam(rawParams.starDensity, RAINBOW_CAT_DEFAULTS.starDensity), 0, 1);
    const seed = resolveNumberParam(rawParams.seed, RAINBOW_CAT_DEFAULTS.seed);

    const beatPulse = audio.beat ? 1 : 0;
    const audioLift = clamp(audio.rms * 0.5 + audio.treble * 0.35 + beatPulse * 0.3, 0, 1);

    ctx.fillStyle = NIGHT_SKY;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = HORIZON_GLOW;
    ctx.fillRect(0, height * 0.56, width, height * 0.44);
    ctx.fillStyle = MOON_GLOW;
    ctx.fillRect(width * 0.08, height * 0.1, width * 0.18, height * 0.18);

    drawStarfield(ctx, width, height, time, speed, sparkle + audioLift * 0.35, starDensity, seed);

    const position = computeRainbowCatPosition({
      width,
      height,
      time,
      speed,
      bounce: bounce + audioLift * 0.28,
      catScale,
      audioLift,
      seed
    });
    const previousPosition = computeRainbowCatPosition({
      width,
      height,
      time: time - 0.12,
      speed,
      bounce: bounce + audioLift * 0.28,
      catScale,
      audioLift,
      seed
    });

    const movingRight = position.x >= previousPosition.x;
    const tailSwing = Math.sin(time * (3.8 + speed * 0.45) + seed * 0.23) * (0.8 + audioLift * 0.45);
    const stridePhase = time * (5.2 + speed * 0.9) + seed * 0.41;

    drawRainbowTrail({
      ctx,
      time,
      catX: position.x,
      catY: position.y,
      pixelSize: position.pixelSize,
      rainbowLength,
      bounce: bounce + audioLift * 0.22,
      trailAlpha,
      sparkle: sparkle + audioLift * 0.2,
      movingRight
    });

    drawRainbowCat({
      ctx,
      x: position.x,
      y: position.y,
      pixelSize: position.pixelSize,
      beatPulse: beatPulse + audioLift * 0.5,
      movingRight,
      tailSwing,
      stridePhase
    });
  }
}
