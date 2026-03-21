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

export type RunnerSpritePart = {
  color: string;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RunnerSprite = {
  parts: RunnerSpritePart[];
  shadow: RunnerSpritePart;
};

const RUNNER_COLORS = {
  outline: "#10141f",
  cobalt: "#2563eb",
  cobaltDark: "#1d4ed8",
  muzzle: "#ffd4b8",
  scarf: "#ffb703",
  gloves: "#f8fafc",
  shoes: "#ef4444",
  sole: "#ffffff",
  eye: "#f8fafc",
  iris: "#0f172a",
  spark: "#7dd3fc"
} as const;

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

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

export function supportTopY(
  worldCol: number,
  seed: number,
  platformRate: number,
  maxSteps: number,
  basePlatformY: number,
  tileSize: number,
  groundTop: number,
  frontPulse: number
): number {
  const platform = platformAt(worldCol, seed, platformRate, maxSteps);
  if (!platform.exists) {
    return groundTop - frontPulse;
  }
  const platformY = basePlatformY - platform.ySteps * tileSize - frontPulse;
  return Math.min(groundTop - frontPulse, platformY);
}

export function runnerJumpOffset(prevSupportY: number, currentSupportY: number, colProgress: number, audioAmount: number): number {
  if (currentSupportY >= prevSupportY) {
    return 0;
  }
  const lift = prevSupportY - currentSupportY;
  const phase = smoothstep(colProgress);
  const arc = Math.sin(phase * Math.PI);
  const extra = 1 + Math.floor(audioAmount * 2);
  return Math.floor(arc * (lift * 0.85 + extra));
}

export function buildRunnerSprite(baseX: number, footY: number, tileSize: number, time: number, audioAmount: number): RunnerSprite {
  const unit = Math.max(1, Math.round(tileSize / 16));
  const x = baseX - 3 * unit;
  const y = footY - 16 * unit;
  const legSwing = Math.sin(time * 18) >= 0 ? unit : -unit;
  const armSwing = Math.sin(time * 18 + Math.PI * 0.65) >= 0 ? unit : -unit;
  const scarfLift = Math.floor(audioAmount * 2) * unit;

  const parts: RunnerSpritePart[] = [
    { name: "quill-back-top", color: RUNNER_COLORS.outline, x: x + unit, y: y + 3 * unit, w: 6 * unit, h: 3 * unit },
    { name: "quill-back-mid", color: RUNNER_COLORS.cobaltDark, x, y: y + 5 * unit, w: 7 * unit, h: 3 * unit },
    { name: "quill-back-low", color: RUNNER_COLORS.cobalt, x: x + unit, y: y + 8 * unit, w: 6 * unit, h: 3 * unit },
    { name: "ear-back", color: RUNNER_COLORS.outline, x: x + 6 * unit, y: y, w: 2 * unit, h: 3 * unit },
    { name: "ear-front", color: RUNNER_COLORS.cobaltDark, x: x + 8 * unit, y: y + unit, w: 2 * unit, h: 3 * unit },
    { name: "head", color: RUNNER_COLORS.cobalt, x: x + 4 * unit, y: y + 2 * unit, w: 7 * unit, h: 7 * unit },
    { name: "face", color: RUNNER_COLORS.muzzle, x: x + 7 * unit, y: y + 4 * unit, w: 4 * unit, h: 4 * unit },
    { name: "eye", color: RUNNER_COLORS.eye, x: x + 8 * unit, y: y + 3 * unit, w: 2 * unit, h: 2 * unit },
    { name: "iris", color: RUNNER_COLORS.iris, x: x + 9 * unit, y: y + 3 * unit, w: unit, h: 2 * unit },
    { name: "torso", color: RUNNER_COLORS.cobaltDark, x: x + 5 * unit, y: y + 8 * unit, w: 5 * unit, h: 4 * unit },
    { name: "chest", color: RUNNER_COLORS.muzzle, x: x + 7 * unit, y: y + 9 * unit, w: 3 * unit, h: 3 * unit },
    {
      name: "scarf-tail",
      color: RUNNER_COLORS.scarf,
      x: x + (legSwing > 0 ? 3 : 2) * unit,
      y: y + (8 - scarfLift / unit) * unit,
      w: 3 * unit,
      h: 2 * unit
    },
    { name: "scarf-knot", color: RUNNER_COLORS.scarf, x: x + 6 * unit, y: y + 8 * unit, w: 3 * unit, h: 2 * unit },
    {
      name: "arm-back",
      color: RUNNER_COLORS.cobaltDark,
      x: x + (4 + armSwing) * unit,
      y: y + 8 * unit,
      w: 2 * unit,
      h: 4 * unit
    },
    {
      name: "glove-back",
      color: RUNNER_COLORS.gloves,
      x: x + (3 + armSwing) * unit,
      y: y + 11 * unit,
      w: 2 * unit,
      h: 2 * unit
    },
    {
      name: "arm-front",
      color: RUNNER_COLORS.cobalt,
      x: x + (9 - armSwing) * unit,
      y: y + 8 * unit,
      w: 2 * unit,
      h: 4 * unit
    },
    {
      name: "glove-front",
      color: RUNNER_COLORS.gloves,
      x: x + (10 - armSwing) * unit,
      y: y + 11 * unit,
      w: 2 * unit,
      h: 2 * unit
    },
    {
      name: "leg-back",
      color: RUNNER_COLORS.cobaltDark,
      x: x + (6 - legSwing) * unit,
      y: y + 12 * unit,
      w: 2 * unit,
      h: 3 * unit
    },
    {
      name: "shoe-back",
      color: RUNNER_COLORS.shoes,
      x: x + (5 - legSwing) * unit,
      y: y + 15 * unit,
      w: 4 * unit,
      h: 2 * unit
    },
    {
      name: "sole-back",
      color: RUNNER_COLORS.sole,
      x: x + (5 - legSwing) * unit,
      y: y + 16 * unit,
      w: 4 * unit,
      h: unit
    },
    {
      name: "leg-front",
      color: RUNNER_COLORS.cobalt,
      x: x + (8 + legSwing) * unit,
      y: y + 12 * unit,
      w: 2 * unit,
      h: 3 * unit
    },
    {
      name: "shoe-front",
      color: RUNNER_COLORS.shoes,
      x: x + (8 + legSwing) * unit,
      y: y + 15 * unit,
      w: 4 * unit,
      h: 2 * unit
    },
    {
      name: "sole-front",
      color: RUNNER_COLORS.sole,
      x: x + (8 + legSwing) * unit,
      y: y + 16 * unit,
      w: 4 * unit,
      h: unit
    },
    {
      name: "spark",
      color: RUNNER_COLORS.spark,
      x: x + 2 * unit,
      y: y + 12 * unit - scarfLift,
      w: 2 * unit,
      h: unit
    }
  ];

  return {
    parts,
    shadow: {
      name: "shadow",
      color: "rgba(0, 0, 0, 0.22)",
      x: x + 2 * unit,
      y: footY + 4 * unit,
      w: 12 * unit,
      h: Math.max(unit, Math.floor(unit * 1.5))
    }
  };
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
    const runnerWorldX = fgScroll + runnerBaseX;
    const currentCol = Math.floor(runnerWorldX / tileSize);
    const prevCol = currentCol - 1;
    const colProgress = ((runnerWorldX % tileSize) + tileSize) % tileSize / tileSize;

    const prevSupportY = supportTopY(
      prevCol,
      seed,
      platformRate,
      platformMaxSteps,
      basePlatformY,
      tileSize,
      groundTop,
      frontPulse
    );
    const currentSupportY = supportTopY(
      currentCol,
      seed,
      platformRate,
      platformMaxSteps,
      basePlatformY,
      tileSize,
      groundTop,
      frontPulse
    );

    const supportY = Math.floor(prevSupportY + (currentSupportY - prevSupportY) * smoothstep(colProgress));
    const hop = runnerJumpOffset(prevSupportY, currentSupportY, colProgress, audioAmount);
    const runBob = Math.floor((Math.sin(time * 14) * 1.5 + audioAmount * 1.5) * 0.5);
    const runnerFootY = supportY - hop - runBob - 1;
    const runnerSprite = buildRunnerSprite(runnerBaseX, runnerFootY, tileSize, time, audioAmount);

    ctx.fillStyle = runnerSprite.shadow.color;
    ctx.fillRect(runnerSprite.shadow.x, runnerSprite.shadow.y, runnerSprite.shadow.w, runnerSprite.shadow.h);

    for (const part of runnerSprite.parts) {
      ctx.fillStyle = part.color;
      ctx.fillRect(part.x, part.y, part.w, part.h);
    }
  }
}
