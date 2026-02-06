/* Escher staircase: an impossible looping stairwell rendered in isometric tiles. */
import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const ESCHER_STAIRCASE_DEFAULTS = {
  stepsPerSide: 8,
  stepSize: 24,
  stepRise: 6,
  speed: 0.25,
  hue: 210,
  hueSpread: 40,
  glow: 0.2,
  audioReact: 0.6
};

type LoopPosition = {
  x: number;
  y: number;
  side: number;
  t: number;
};

const LOOP_DIRECTIONS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 }
];

export const resolveLoopPosition = (progress: number, stepsPerSide: number): LoopPosition => {
  const loopLength = stepsPerSide * 4;
  const wrapped = ((progress % loopLength) + loopLength) % loopLength;
  const side = Math.floor(wrapped / stepsPerSide);
  const offset = wrapped - side * stepsPerSide;
  const direction = LOOP_DIRECTIONS[side] ?? LOOP_DIRECTIONS[0];
  const startX = side === 0 ? 0 : side === 1 ? stepsPerSide : side === 2 ? stepsPerSide : 0;
  const startY = side === 0 ? 0 : side === 1 ? 0 : side === 2 ? stepsPerSide : stepsPerSide;

  return {
    x: startX + direction.dx * offset,
    y: startY + direction.dy * offset,
    side,
    t: offset / stepsPerSide
  };
};

const drawStep = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  rise: number,
  hue: number,
  alpha: number,
  glow: number
): void => {
  const halfHeight = tileSize * 0.5;
  const topA = { x, y };
  const topB = { x: x + tileSize, y: y + halfHeight };
  const topC = { x, y: y + halfHeight * 2 };
  const topD = { x: x - tileSize, y: y + halfHeight };

  const bottomB = { x: topB.x, y: topB.y + rise };
  const bottomC = { x: topC.x, y: topC.y + rise };
  const bottomD = { x: topD.x, y: topD.y + rise };

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = `hsla(${hue}, 80%, 60%, ${glow})`;
  ctx.shadowBlur = glow * 24;

  ctx.fillStyle = `hsla(${hue}, 60%, 26%, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(topD.x, topD.y);
  ctx.lineTo(topC.x, topC.y);
  ctx.lineTo(bottomC.x, bottomC.y);
  ctx.lineTo(bottomD.x, bottomD.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `hsla(${hue}, 55%, 32%, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(topB.x, topB.y);
  ctx.lineTo(topC.x, topC.y);
  ctx.lineTo(bottomC.x, bottomC.y);
  ctx.lineTo(bottomB.x, bottomB.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `hsla(${hue}, 65%, 48%, ${alpha})`;
  ctx.beginPath();
  ctx.moveTo(topA.x, topA.y);
  ctx.lineTo(topB.x, topB.y);
  ctx.lineTo(topC.x, topC.y);
  ctx.lineTo(topD.x, topD.y);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
};

export class EscherStaircaseEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const stepsPerSide = clamp(Math.round(params.stepsPerSide ?? ESCHER_STAIRCASE_DEFAULTS.stepsPerSide), 4, 20);
    const stepSize = clamp(params.stepSize ?? ESCHER_STAIRCASE_DEFAULTS.stepSize, 12, 48);
    const stepRise = clamp(params.stepRise ?? ESCHER_STAIRCASE_DEFAULTS.stepRise, 2, 16);
    const speed = Math.max(0, params.speed ?? ESCHER_STAIRCASE_DEFAULTS.speed);
    const hue = params.hue ?? ESCHER_STAIRCASE_DEFAULTS.hue;
    const hueSpread = clamp(params.hueSpread ?? ESCHER_STAIRCASE_DEFAULTS.hueSpread, 0, 120);
    const glow = clamp(params.glow ?? ESCHER_STAIRCASE_DEFAULTS.glow, 0, 1);
    const audioReact = clamp(params.audioReact ?? ESCHER_STAIRCASE_DEFAULTS.audioReact, 0, 1);

    ctx.fillStyle = "rgba(6, 8, 14, 0.35)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height * 0.5);

    const loopLength = stepsPerSide * 4;
    const phase = (time * speed * stepsPerSide) % loopLength;
    const lift = stepRise * (1 + audio.bass * audioReact * 0.5);
    const centerOffset = stepsPerSide / 2;

    const steps = Array.from({ length: loopLength }, (_, index) => {
      const progress = index + phase;
      const { x, y } = resolveLoopPosition(progress, stepsPerSide);
      const elevation = ((progress % loopLength) + loopLength) % loopLength;
      const depth = x + y + elevation * 0.15;
      return {
        x: x - centerOffset,
        y: y - centerOffset,
        elevation: elevation * lift,
        depth,
        index
      };
    }).sort((a, b) => a.depth - b.depth);

    steps.forEach((step) => {
      const screenX = (step.x - step.y) * stepSize;
      const screenY = (step.x + step.y) * stepSize * 0.5 - step.elevation;
      const shade = hue + Math.sin(time * 0.6 + step.index * 0.4) * hueSpread;
      const alpha = 0.2 + step.index / loopLength;
      drawStep(ctx, screenX, screenY, stepSize, lift, shade, alpha, glow * (0.6 + audio.rms * 0.4));
    });

    ctx.restore();
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 0, width, height);
  }
}
