import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const PLATFORMER_SCROLL_DEFAULTS = {
  speed: 140,
  seed: 1337,
  tileSize: 16,
  groundRatio: 0.24,
  parallaxFar: 0.2,
  parallaxMid: 0.5,
  parallaxFront: 1.0,
  audioReact: 0.35,
  beatKick: 0.35,
  platformRate: 0.55,
  platformMaxSteps: 5
};


type PlatformInfo = {
  exists: boolean;
  ySteps: number;
  lengthCols: number;
};

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const quantize = (value: number, step: number): number => Math.floor(value / step) * step;

export function hash1(index: number, seed: number): number {
  const x = Math.sin((index + seed * 0.101) * 127.1 + seed * 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

export function platformAt(worldCol: number, seed: number, platformRate: number, maxSteps: number): PlatformInfo {
  const clampedRate = clamp(platformRate, 0, 1);
  const safeMaxSteps = Math.max(1, Math.floor(maxSteps));
  const groupSize = 2 + Math.floor(hash1(worldCol * 0.5 + 19, seed) * 4);
  const groupIndex = Math.floor(worldCol / groupSize);

  const shouldSpawn = hash1(groupIndex * 13 + 3, seed) < clampedRate;
  if (!shouldSpawn) {
    return { exists: false, ySteps: 0, lengthCols: 0 };
  }

  const lengthCols = 2 + Math.floor(hash1(groupIndex * 17 + 7, seed) * 4);
  const stepBias = hash1(groupIndex * 23 + 11, seed);
  const ySteps = Math.floor(stepBias * (safeMaxSteps + 1));

  const inSegment = ((worldCol % groupSize) + groupSize) % groupSize;
  if (inSegment >= lengthCols) {
    return { exists: false, ySteps, lengthCols };
  }

  return { exists: true, ySteps, lengthCols };
}

const drawHillLayer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  cameraX: number,
  speed: number,
  seed: number,
  amplitude: number,
  span: number,
  color: string,
  baseHeight: number
): void => {
  const scroll = cameraX * speed;
  const start = Math.floor(scroll / span) - 1;
  const count = Math.ceil(width / span) + 3;

  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const worldIndex = start + i;
    const x = Math.floor(worldIndex * span - scroll);
    const h = baseHeight + Math.floor(hash1(worldIndex, seed) * amplitude);
    ctx.beginPath();
    ctx.moveTo(x, horizonY + 2);
    ctx.lineTo(x + span * 0.5, horizonY - h);
    ctx.lineTo(x + span, horizonY + 2);
    ctx.closePath();
    ctx.fill();
  }
};

export class PlatformerScrollEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = Math.max(0, asFinite(params.speed, PLATFORMER_SCROLL_DEFAULTS.speed));
    const seed = asFinite(params.seed, PLATFORMER_SCROLL_DEFAULTS.seed);
    const tileSize = Math.max(8, Math.floor(asFinite(params.tileSize, PLATFORMER_SCROLL_DEFAULTS.tileSize)));
    const groundRatio = clamp(asFinite(params.groundRatio, PLATFORMER_SCROLL_DEFAULTS.groundRatio), 0.2, 0.3);
    const parallaxFar = clamp(asFinite(params.parallaxFar, PLATFORMER_SCROLL_DEFAULTS.parallaxFar), 0.05, 0.6);
    const parallaxMid = clamp(asFinite(params.parallaxMid, PLATFORMER_SCROLL_DEFAULTS.parallaxMid), 0.15, 0.9);
    const parallaxFront = clamp(asFinite(params.parallaxFront, PLATFORMER_SCROLL_DEFAULTS.parallaxFront), 0.7, 1.4);
    const audioReact = clamp(asFinite(params.audioReact, PLATFORMER_SCROLL_DEFAULTS.audioReact), 0, 1);
    const beatKick = clamp(asFinite(params.beatKick, PLATFORMER_SCROLL_DEFAULTS.beatKick), 0, 1);
    const platformRate = clamp(asFinite(params.platformRate, PLATFORMER_SCROLL_DEFAULTS.platformRate), 0, 1);
    const platformMaxSteps = Math.max(1, Math.floor(asFinite(params.platformMaxSteps, PLATFORMER_SCROLL_DEFAULTS.platformMaxSteps)));

    const audioAmount = audioReact * clamp(audio.rms, 0, 1);
    const camNudge = audio.beat ? Math.floor(beatKick * 6) : 0;
    const cameraX = time * speed;

    const groundHeight = Math.floor(height * groundRatio);
    const groundTop = height - groundHeight;
    const frontPulse = Math.floor(audioAmount * 2);

    ctx.clearRect(0, 0, width, height);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#86c5ff");
    sky.addColorStop(0.55, "#7db3f0");
    sky.addColorStop(1, "#5a7fb3");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const horizonY = Math.floor(height * 0.56);
    drawHillLayer(ctx, width, horizonY, cameraX + camNudge, parallaxFar, seed + 100, Math.floor(height * 0.1), 96, "#617ea5", 22);
    drawHillLayer(
      ctx,
      width,
      horizonY + 10,
      cameraX + camNudge,
      parallaxMid,
      seed + 400,
      Math.floor(height * 0.16),
      72,
      "#405772",
      28
    );

    const cityBase = horizonY + 12;
    const cityScroll = (cameraX + camNudge) * parallaxMid;
    const cityStep = tileSize * 2;
    const cityStart = Math.floor(cityScroll / cityStep) - 1;
    const cityCount = Math.ceil(width / cityStep) + 3;
    ctx.fillStyle = "#32455c";
    for (let i = 0; i < cityCount; i += 1) {
      const world = cityStart + i;
      const x = Math.floor(world * cityStep - cityScroll);
      const towerH = tileSize + Math.floor(hash1(world * 2 + 5, seed + 700) * tileSize * 4);
      ctx.fillRect(x, cityBase - towerH, tileSize + 2, towerH);
    }

    const fgScroll = (cameraX + camNudge) * parallaxFront;
    const tileOffset = ((fgScroll % tileSize) + tileSize) % tileSize;
    const groundY = groundTop + frontPulse;

    ctx.fillStyle = "#2f3a2f";
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = "#5f6f56";
    ctx.fillRect(0, groundY, width, Math.max(2, Math.floor(tileSize * 0.25)));

    ctx.fillStyle = "#3f4e3a";
    const tileRows = Math.ceil((height - groundY) / tileSize);
    const tileCols = Math.ceil(width / tileSize) + 2;
    for (let row = 0; row < tileRows; row += 1) {
      const y = groundY + row * tileSize;
      for (let col = 0; col < tileCols; col += 1) {
        const x = Math.floor(col * tileSize - tileOffset);
        if ((row + col) % 2 === 0) {
          ctx.fillRect(x, y, tileSize - 1, tileSize - 1);
        }
      }
    }

    const basePlatformY = groundTop - tileSize * 2;
    const worldStart = Math.floor(fgScroll / tileSize) - 2;
    const worldCount = Math.ceil(width / tileSize) + 6;

    ctx.fillStyle = "#1f222a";
    for (let i = 0; i < worldCount; i += 1) {
      const worldCol = worldStart + i;
      const platform = platformAt(worldCol, seed, platformRate, platformMaxSteps);
      if (!platform.exists) {
        continue;
      }
      const x = Math.floor(worldCol * tileSize - fgScroll);
      const platformY = basePlatformY - platform.ySteps * tileSize - frontPulse;
      ctx.fillRect(x, platformY, tileSize, Math.max(3, Math.floor(tileSize * 0.5)));

      if (hash1(worldCol * 5 + 29, seed) > 0.8) {
        ctx.fillStyle = "#79836f";
        ctx.fillRect(x + 2, platformY - 4, 2, 4);
        ctx.fillStyle = "#1f222a";
      }
    }

    const runnerBaseX = Math.floor(width * 0.28);
    const legPhase = Math.sin(time * 18);
    const bob = Math.floor((Math.sin(time * 10) * 2 + audioAmount * 3) * 0.5);
    const runnerFootY = groundTop - frontPulse - 1 - bob;
    const bodyW = Math.max(8, Math.floor(tileSize * 0.7));
    const bodyH = Math.max(10, Math.floor(tileSize * 0.95));

    ctx.fillStyle = "#111317";
    ctx.fillRect(runnerBaseX, runnerFootY - bodyH, bodyW, bodyH);
    ctx.fillRect(runnerBaseX + 2, runnerFootY - bodyH - 5, bodyW - 4, 5);

    const legTick = legPhase > 0 ? 2 : -2;
    const legY = runnerFootY;
    ctx.fillRect(runnerBaseX + 1, legY, 3, 6);
    ctx.fillRect(runnerBaseX + bodyW - 4 + legTick, legY, 3, 6);
    ctx.fillRect(runnerBaseX - 2, runnerFootY - bodyH + 2, 2, 4);
    ctx.fillRect(runnerBaseX + bodyW, runnerFootY - bodyH + 2, 2, 4);

    const shadowY = quantize(runnerFootY + 6, 1);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(runnerBaseX - 2, shadowY, bodyW + 4, 2);
  }
}
