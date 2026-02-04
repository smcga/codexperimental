import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const TREE_GROWTH_DEFAULTS = {
  growthSpeed: 0.18,
  branchLevels: 3,
  spread: 0.55,
  sway: 0.18,
  leafSize: 6,
  leafHue: 115,
  seed: 3
};

const hashFloat = (value: number): number => {
  const sine = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
  return sine - Math.floor(sine);
};

export class TreeGrowthEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const growthSpeed = params.growthSpeed ?? TREE_GROWTH_DEFAULTS.growthSpeed;
    const branchLevels = params.branchLevels ?? TREE_GROWTH_DEFAULTS.branchLevels;
    const spread = params.spread ?? TREE_GROWTH_DEFAULTS.spread;
    const sway = params.sway ?? TREE_GROWTH_DEFAULTS.sway;
    const leafSize = params.leafSize ?? TREE_GROWTH_DEFAULTS.leafSize;
    const leafHue = params.leafHue ?? TREE_GROWTH_DEFAULTS.leafHue;
    const seed = params.seed ?? TREE_GROWTH_DEFAULTS.seed;

    const growth = clamp(time * growthSpeed + audio.rms * 0.2, 0, 1);
    if (growth <= 0) {
      return;
    }

    const trunkProgress = clamp(growth / 0.35, 0, 1);
    const branchProgress = clamp((growth - 0.25) / 0.75, 0, 1);
    const totalLevels = Math.max(0, Math.round(branchLevels));
    const baseLength = height * 0.35;
    const baseWidth = Math.max(2, Math.min(width, height) * 0.012);
    const hue = 32 + audio.bass * 12;
    const swayAmount = Math.sin(time * 0.6 + seed) * sway * (0.4 + audio.bass * 0.6);
    const trunkAngle = -Math.PI / 2 + swayAmount;

    ctx.save();
    ctx.translate(width * 0.5, height * 0.9);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = `hsl(${hue}, 35%, 28%)`;
    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(trunkAngle) * baseLength * trunkProgress, Math.sin(trunkAngle) * baseLength * trunkProgress);
    ctx.stroke();

    if (trunkProgress < 1 || totalLevels === 0) {
      ctx.restore();
      return;
    }

    const rootX = Math.cos(trunkAngle) * baseLength;
    const rootY = Math.sin(trunkAngle) * baseLength;

    const drawLeaf = (x: number, y: number, leafIndex: number) => {
      const flutter = 0.6 + hashFloat(seed * 17.3 + leafIndex * 13.1) * 0.7;
      ctx.fillStyle = `hsla(${leafHue}, 55%, ${45 + audio.treble * 12}%, 0.7)`;
      ctx.beginPath();
      ctx.arc(x, y, leafSize * flutter, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBranch = (
      x: number,
      y: number,
      angle: number,
      length: number,
      level: number,
      branchIndex: number
    ) => {
      const levelProgress = clamp(branchProgress * totalLevels - level, 0, 1);
      if (levelProgress <= 0) {
        return;
      }

      const segmentLength = length * levelProgress;
      ctx.lineWidth = baseWidth * Math.pow(0.7, level + 1);
      ctx.strokeStyle = `hsl(${hue + level * 4}, 40%, ${28 + level * 3}%)`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const endX = x + Math.cos(angle) * segmentLength;
      const endY = y + Math.sin(angle) * segmentLength;
      ctx.lineTo(endX, endY);
      ctx.stroke();

      if (levelProgress < 1) {
        return;
      }

      if (level + 1 >= totalLevels) {
        drawLeaf(endX, endY, branchIndex);
        return;
      }

      const childLength = length * (0.65 + hashFloat(seed + branchIndex * 1.7) * 0.1);
      const swayPhase = Math.sin(time * 0.8 + branchIndex) * sway * 0.25;
      for (let child = 0; child < 2; child += 1) {
        const jitter = hashFloat(seed + branchIndex * 11.1 + child * 19.7 + level * 4.2);
        const childSpread = spread * (0.6 + jitter * 0.5);
        const childAngle = angle + (child === 0 ? -childSpread : childSpread) + swayPhase;
        drawBranch(endX, endY, childAngle, childLength, level + 1, branchIndex * 2 + child + 1);
      }
    };

    drawBranch(rootX, rootY, trunkAngle - spread * 0.25, baseLength * 0.65, 0, 1);
    drawBranch(rootX, rootY, trunkAngle + spread * 0.25, baseLength * 0.65, 0, 2);
    ctx.restore();
  }
}
