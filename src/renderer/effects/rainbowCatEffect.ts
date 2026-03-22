import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

/**
 * Cheerful synth-night rainbow cat with a chunky pixel body, scrolling stars, and an audio-reactive rainbow trail.
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

const CAT_OUTLINE = "#3d274c";
const CAT_FUR = "#9ca1b0";
const CAT_FUR_SHADOW = "#747b8c";
const CAT_TREAT = "#f6c78c";
const CAT_TREAT_SPECK = "#ff6fa8";
const CAT_CHEEK = "#ff9ecb";
const NIGHT_SKY = "#090b1d";
const HORIZON_GLOW = "#1a1f45";

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
  audioLift
}: {
  width: number;
  height: number;
  time: number;
  speed: number;
  bounce: number;
  catScale: number;
  audioLift: number;
}): { x: number; y: number; bob: number; pixelSize: number } => {
  const pixelSize = Math.max(2, Math.min(width, height) * 0.0075 * catScale);
  const bob = Math.sin(time * (4.2 + speed * 0.8)) * (height * 0.03 * bounce + audioLift * height * 0.035);
  const travel = ((time * speed * width * 0.18) % (width * 0.42)) - width * 0.21;
  return {
    x: width * 0.48 + travel,
    y: height * 0.5 + bob,
    bob,
    pixelSize
  };
};

const drawPixelRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  pixelSize: number,
  color: string
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * pixelSize, h * pixelSize);
};

const drawRainbowTrail = (
  ctx: CanvasRenderingContext2D,
  width: number,
  time: number,
  catX: number,
  catY: number,
  pixelSize: number,
  rainbowLength: number,
  bounce: number,
  trailAlpha: number,
  sparkle: number
): void => {
  const segmentCount = Math.max(6, Math.floor(10 + rainbowLength * 24));
  const segmentWidth = pixelSize * 4;
  const stripeHeight = pixelSize * 1.45;
  const startX = catX - segmentCount * segmentWidth;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = clamp(trailAlpha, 0.05, 1);

  for (let stripeIndex = 0; stripeIndex < RAINBOW_TRAIL_COLORS.length; stripeIndex += 1) {
    const color = RAINBOW_TRAIL_COLORS[stripeIndex];
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      const wave = Math.sin(time * 7 + segmentIndex * 0.55 + stripeIndex * 0.7);
      const jitter = wave * bounce * pixelSize * 0.9;
      const x = startX + segmentIndex * segmentWidth;
      const y = catY - pixelSize * 2.2 + stripeIndex * stripeHeight + jitter;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, segmentWidth + pixelSize, stripeHeight + pixelSize * 0.15);

      if (sparkle > 0.02 && segmentIndex % 3 === stripeIndex % 3) {
        ctx.fillStyle = `rgba(255,255,255,${0.08 + sparkle * 0.22})`;
        ctx.fillRect(x + segmentWidth * 0.3, y + stripeHeight * 0.15, pixelSize, pixelSize);
      }
    }
  }

  ctx.restore();

  const trailEndX = Math.min(width, catX + pixelSize * 1.5);
  ctx.fillStyle = `rgba(255,255,255,${0.04 + sparkle * 0.06})`;
  ctx.fillRect(startX, catY - pixelSize * 2.5, trailEndX - startX, pixelSize * 8.5);
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
  const starCount = Math.max(8, Math.floor(12 + starDensity * 34));
  for (let index = 0; index < starCount; index += 1) {
    const starSeed = seed * 1000 + index * 17.17;
    const xBase = rainbowCatHash01(starSeed + 1.1) * width;
    const yBase = rainbowCatHash01(starSeed + 2.2) * height * 0.78;
    const drift = (time * (16 + speed * 12) * (0.25 + rainbowCatHash01(starSeed + 3.7))) % (width + 24);
    const x = (xBase - drift + width + 24) % (width + 24) - 12;
    const y = yBase + Math.sin(time * 1.8 + starSeed) * 3.2;
    const twinkle = 0.45 + 0.55 * Math.sin(time * (5.5 + sparkle * 2) + starSeed * 0.4);
    const size = 1 + rainbowCatHash01(starSeed + 4.4) * (1.2 + sparkle * 2.5);
    const alpha = 0.24 + twinkle * (0.2 + sparkle * 0.42);

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(x, y, size, size);

    if (twinkle > 0.72) {
      ctx.fillRect(x - size, y + size * 0.35, size * 3, Math.max(1, size * 0.35));
      ctx.fillRect(x + size * 0.35, y - size, Math.max(1, size * 0.35), size * 3);
    }
  }
};

const drawRainbowCat = (ctx: CanvasRenderingContext2D, x: number, y: number, pixelSize: number, beatPulse: number): void => {
  const left = x - pixelSize * 8;
  const top = y - pixelSize * 6;

  drawPixelRect(ctx, left + pixelSize * 0, top + pixelSize * 2, 10, 8, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 1, top + pixelSize * 3, 8, 6, 1, CAT_FUR_SHADOW);
  drawPixelRect(ctx, left + pixelSize * 2, top + pixelSize * 3, 6, 6, 1, CAT_TREAT);

  ctx.fillStyle = CAT_TREAT_SPECK;
  const sprinkles = [
    [left + pixelSize * 2.8, top + pixelSize * 3.8],
    [left + pixelSize * 4.1, top + pixelSize * 4.4],
    [left + pixelSize * 6.3, top + pixelSize * 5.1],
    [left + pixelSize * 3.5, top + pixelSize * 6.3],
    [left + pixelSize * 5.7, top + pixelSize * 7.2],
    [left + pixelSize * 7.1, top + pixelSize * 4.2]
  ];
  sprinkles.forEach(([sx, sy], index) => {
    ctx.fillRect(sx, sy + (index % 2 === 0 ? 0 : pixelSize * 0.35), pixelSize, pixelSize * 0.55);
  });

  drawPixelRect(ctx, left + pixelSize * 8, top + pixelSize * 1, 5, 5, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 9, top + pixelSize * 2, 3, 3, 1, CAT_FUR);
  drawPixelRect(ctx, left + pixelSize * 9, top + pixelSize * 0, 1, 1, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 11, top + pixelSize * 0, 1, 1, 1, CAT_OUTLINE);

  ctx.fillStyle = CAT_CHEEK;
  ctx.fillRect(left + pixelSize * 9.1, top + pixelSize * 3.8, pixelSize * 0.8, pixelSize * 0.8);
  ctx.fillRect(left + pixelSize * 11.1, top + pixelSize * 3.8, pixelSize * 0.8, pixelSize * 0.8);

  ctx.fillStyle = CAT_OUTLINE;
  ctx.fillRect(left + pixelSize * 9.8, top + pixelSize * 2.7, pixelSize * 0.55, pixelSize * 0.55);
  ctx.fillRect(left + pixelSize * 11.1, top + pixelSize * 2.7, pixelSize * 0.55, pixelSize * 0.55);
  ctx.fillRect(left + pixelSize * 10.5, top + pixelSize * 3.4, pixelSize * 0.5, pixelSize * 0.5);
  ctx.fillRect(left + pixelSize * 10.1, top + pixelSize * 4.2, pixelSize * 1.1, pixelSize * 0.4);

  const pawLift = beatPulse * pixelSize * 0.9;
  drawPixelRect(ctx, left + pixelSize * 1.3, top + pixelSize * (8.4 - pawLift * 0.05), 1.2, 2.4, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 3.5, top + pixelSize * 8.7, 1.2, 2.4, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 6.0, top + pixelSize * (8.4 - pawLift * 0.04), 1.2, 2.4, 1, CAT_OUTLINE);
  drawPixelRect(ctx, left + pixelSize * 8.2, top + pixelSize * 8.7, 1.2, 2.4, 1, CAT_OUTLINE);

  ctx.strokeStyle = CAT_OUTLINE;
  ctx.lineWidth = Math.max(1.2, pixelSize * 0.55);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(left + pixelSize * 0.8, top + pixelSize * 5.7);
  ctx.quadraticCurveTo(left - pixelSize * 2.8, top + pixelSize * 3.8, left - pixelSize * 2.3, top + pixelSize * 7.4);
  ctx.stroke();
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
    ctx.fillRect(0, height * 0.58, width, height * 0.42);

    drawStarfield(ctx, width, height, time, speed, sparkle + audioLift * 0.35, starDensity, seed);

    const position = computeRainbowCatPosition({
      width,
      height,
      time,
      speed,
      bounce: bounce + audioLift * 0.35,
      catScale,
      audioLift
    });

    drawRainbowTrail(
      ctx,
      width,
      time,
      position.x,
      position.y,
      position.pixelSize,
      rainbowLength,
      bounce + audioLift * 0.2,
      trailAlpha,
      sparkle + audioLift * 0.25
    );

    drawRainbowCat(ctx, position.x, position.y, position.pixelSize, beatPulse + audioLift * 0.5);
  }
}
