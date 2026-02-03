import { clamp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const hashFloat = (value: number): number => {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

export class TreeGrowthEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const speed = Math.max(0, resolveNumberParam(rawParams.speed, 0.18));
    const levels = clamp(Math.round(resolveNumberParam(rawParams.levels, 6)), 3, 9);
    const trunkHeight = clamp(resolveNumberParam(rawParams.trunkHeight, 0.45), 0.25, 0.65);
    const branchScale = clamp(resolveNumberParam(rawParams.branchScale, 0.72), 0.5, 0.85);
    const branchAngleDeg = clamp(resolveNumberParam(rawParams.branchAngle, 28), 10, 60);
    const trunkWidth = clamp(resolveNumberParam(rawParams.trunkWidth, 10), 4, 24);
    const sway = clamp(resolveNumberParam(rawParams.sway, 0.35), 0, 1.2);
    const leafSize = clamp(resolveNumberParam(rawParams.leafSize, 3), 0, 10);
    const jitter = clamp(resolveNumberParam(rawParams.jitter, 0.25), 0, 0.6);
    const seed = resolveNumberParam(rawParams.seed, 0);
    const growthOverride = rawParams.growth;

    const growth =
      typeof growthOverride === "number" && Number.isFinite(growthOverride)
        ? clamp(growthOverride, 0, 1)
        : smoothstep(0, 1, (time * speed + seed * 0.13) % 1);

    if (growth <= 0) {
      return;
    }

    ctx.fillStyle = "rgba(6, 8, 12, 0.2)";
    ctx.fillRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height * 0.92);
    ctx.lineCap = "round";

    const baseLength = height * trunkHeight;
    const baseSway = Math.sin(time * 0.6 + seed) * sway * (0.2 + audio.bass);
    const spread = (branchAngleDeg * Math.PI) / 180;
    const levelDelay = 0.14;

    const drawBranch = (
      x: number,
      y: number,
      length: number,
      angle: number,
      depth: number,
      branchId: number
    ): void => {
      const levelProgress = clamp((growth - depth * levelDelay) / (1 - depth * levelDelay), 0, 1);
      if (levelProgress <= 0) {
        return;
      }

      const segment = length * levelProgress;
      const endX = x + Math.cos(angle) * segment;
      const endY = y - Math.sin(angle) * segment;
      const widthScale = Math.pow(0.7, depth);
      ctx.strokeStyle = `hsla(28, 35%, ${28 + depth * 6}%, ${0.7 + audio.rms * 0.3})`;
      ctx.lineWidth = trunkWidth * widthScale;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      if (depth >= levels - 1 || levelProgress < 0.98) {
        if (leafSize > 0 && depth >= levels - 2) {
          const leafVariance = 0.7 + hashFloat(seed + branchId * 3.1) * 0.8;
          ctx.fillStyle = `hsla(120, 55%, ${45 + audio.treble * 20}%, ${0.5 + audio.rms * 0.4})`;
          ctx.beginPath();
          ctx.arc(endX, endY, leafSize * leafVariance, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }

      const varianceA = (hashFloat(seed + branchId * 1.37) - 0.5) * 2 * spread * jitter;
      const varianceB = (hashFloat(seed + branchId * 2.91) - 0.5) * 2 * spread * jitter;
      const scaleA = branchScale * (0.82 + hashFloat(seed + branchId * 5.11) * 0.3);
      const scaleB = branchScale * (0.82 + hashFloat(seed + branchId * 7.77) * 0.3);

      drawBranch(
        endX,
        endY,
        length * scaleA,
        angle + spread + varianceA + baseSway * 0.4,
        depth + 1,
        branchId * 2
      );
      drawBranch(
        endX,
        endY,
        length * scaleB,
        angle - spread + varianceB + baseSway * 0.4,
        depth + 1,
        branchId * 2 + 1
      );
    };

    drawBranch(0, 0, baseLength, Math.PI / 2 + baseSway, 0, 1);
    ctx.restore();
  }
}
