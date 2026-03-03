import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const WORLD_BUILDER_DEFAULTS = {
  gridWidth: 18,
  gridDepth: 18,
  maxHeight: 9,
  voxelSize: 16,
  speed: 0.22,
  horizon: 0.72,
  audioReact: 0.65,
  beatKick: 0.75,
  seed: 4242
};

export type WorldBuilderParams = {
  gridWidth: number;
  gridDepth: number;
  maxHeight: number;
  voxelSize: number;
  speed: number;
  horizon: number;
  audioReact: number;
  beatKick: number;
  seed: number;
};

const hash = (x: number, z: number, seed: number): number => {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 17.37) * 43758.5453123;
  return n - Math.floor(n);
};

export const resolveWorldBuilderParams = (params: EffectRenderContext["params"]): WorldBuilderParams => ({
  gridWidth: clamp(Math.round(params.gridWidth ?? WORLD_BUILDER_DEFAULTS.gridWidth), 8, 34),
  gridDepth: clamp(Math.round(params.gridDepth ?? WORLD_BUILDER_DEFAULTS.gridDepth), 8, 34),
  maxHeight: clamp(Math.round(params.maxHeight ?? WORLD_BUILDER_DEFAULTS.maxHeight), 2, 20),
  voxelSize: clamp(params.voxelSize ?? WORLD_BUILDER_DEFAULTS.voxelSize, 8, 32),
  speed: Math.max(0.03, params.speed ?? WORLD_BUILDER_DEFAULTS.speed),
  horizon: clamp(params.horizon ?? WORLD_BUILDER_DEFAULTS.horizon, 0.4, 0.9),
  audioReact: clamp(params.audioReact ?? WORLD_BUILDER_DEFAULTS.audioReact, 0, 1),
  beatKick: clamp(params.beatKick ?? WORLD_BUILDER_DEFAULTS.beatKick, 0, 1.4),
  seed: Math.round(params.seed ?? WORLD_BUILDER_DEFAULTS.seed)
});

export const generateWorldBuilderHeights = (
  gridWidth: number,
  gridDepth: number,
  maxHeight: number,
  seed: number
): number[] => {
  const heights: number[] = new Array(gridWidth * gridDepth);
  const cx = (gridWidth - 1) * 0.5;
  const cz = (gridDepth - 1) * 0.5;
  const maxDist = Math.hypot(cx, cz) || 1;

  for (let z = 0; z < gridDepth; z += 1) {
    for (let x = 0; x < gridWidth; x += 1) {
      const dx = x - cx;
      const dz = z - cz;
      const distNorm = Math.hypot(dx, dz) / maxDist;
      const cityMask = Math.pow(1 - distNorm, 1.2);
      const variation = hash(x, z, seed);
      const ridge = Math.sin((x + seed) * 0.45) * 0.08 + Math.cos((z - seed) * 0.38) * 0.08;
      const heightNorm = clamp(cityMask * 0.8 + variation * 0.35 + ridge, 0, 1);
      heights[z * gridWidth + x] = Math.max(1, Math.round(lerp(1, maxHeight, heightNorm)));
    }
  }

  return heights;
};

const drawVoxel = (
  ctx: CanvasRenderingContext2D,
  isoX: number,
  isoY: number,
  halfW: number,
  halfH: number,
  levels: number,
  hue: number
): void => {
  const stackHeight = levels * halfH;
  const topY = isoY - stackHeight;

  const topL = `hsl(${hue}, 65%, 70%)`;
  const leftL = `hsl(${(hue + 8) % 360}, 60%, 56%)`;
  const rightL = `hsl(${(hue - 8 + 360) % 360}, 58%, 46%)`;

  ctx.beginPath();
  ctx.moveTo(isoX, topY - halfH);
  ctx.lineTo(isoX + halfW, topY);
  ctx.lineTo(isoX, topY + halfH);
  ctx.lineTo(isoX - halfW, topY);
  ctx.closePath();
  ctx.fillStyle = topL;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(isoX - halfW, topY);
  ctx.lineTo(isoX, topY + halfH);
  ctx.lineTo(isoX, isoY + halfH);
  ctx.lineTo(isoX - halfW, isoY);
  ctx.closePath();
  ctx.fillStyle = leftL;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(isoX + halfW, topY);
  ctx.lineTo(isoX, topY + halfH);
  ctx.lineTo(isoX, isoY + halfH);
  ctx.lineTo(isoX + halfW, isoY);
  ctx.closePath();
  ctx.fillStyle = rightL;
  ctx.fill();
};

export class WorldBuilderEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const cfg = resolveWorldBuilderParams(params);
    const heights = generateWorldBuilderHeights(cfg.gridWidth, cfg.gridDepth, cfg.maxHeight, cfg.seed);

    const horizonY = height * cfg.horizon;
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, "#071329");
    skyGrad.addColorStop(0.55, "#143058");
    skyGrad.addColorStop(1, "#203c3a");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    groundGrad.addColorStop(0, "rgba(35, 62, 52, 0.92)");
    groundGrad.addColorStop(1, "rgba(7, 10, 14, 1)");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, width, height - horizonY);

    const beat = audio.isBeat ? 1 : 0;
    const beatPulse = 1 + beat * cfg.beatKick * 0.45;
    const cycle = (time * cfg.speed) % 1;
    const halfW = cfg.voxelSize;
    const halfH = Math.max(4, cfg.voxelSize * 0.48);
    const originX = width * 0.5;
    const originY = horizonY + height * 0.16;
    const centerX = (cfg.gridWidth - 1) * 0.5;
    const centerZ = (cfg.gridDepth - 1) * 0.5;
    const maxDist = Math.hypot(centerX, centerZ) || 1;

    const cells: Array<{ x: number; z: number; sort: number }> = [];
    for (let z = 0; z < cfg.gridDepth; z += 1) {
      for (let x = 0; x < cfg.gridWidth; x += 1) {
        cells.push({ x, z, sort: x + z });
      }
    }

    cells.sort((a, b) => a.sort - b.sort);

    cells.forEach(({ x, z }) => {
      const index = z * cfg.gridWidth + x;
      const targetHeight = heights[index];
      const dx = x - centerX;
      const dz = z - centerZ;
      const distNorm = Math.hypot(dx, dz) / maxDist;
      const emergeStart = distNorm * 0.45;
      const emergeEnd = clamp(emergeStart + 0.38, 0.08, 0.98);
      const phase = clamp((cycle - emergeStart) / (emergeEnd - emergeStart), 0, 1);
      const audioLift = audio.rms * cfg.audioReact * 0.35 + audio.bass * cfg.audioReact * 0.25;
      const grown = Math.max(0, Math.floor(targetHeight * clamp(phase + audioLift, 0, 1) * beatPulse));
      if (grown <= 0) {
        return;
      }

      const isoX = originX + (x - z) * halfW;
      const isoY = originY + (x + z) * (halfH * 0.5);
      const hueBase = 168 + hash(x, z, cfg.seed + 91) * 40 + audio.treble * 18;
      drawVoxel(ctx, isoX, isoY, halfW, halfH, grown, hueBase);
    });

    ctx.globalAlpha = 0.2 + audio.rms * 0.2;
    ctx.fillStyle = "#9ef5ff";
    ctx.fillRect(0, horizonY - 2, width, 2);
    ctx.globalAlpha = 1;
  }
}
