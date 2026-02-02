import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type TriggerMode = "beat" | "random" | "both";

type BoltPath = Array<{ x: number; y: number }>;

const DEFAULT_COOLDOWN = 1.5;
const DEFAULT_FLASH_DURATION = 0.12;
const DEFAULT_CHANCE_PER_SECOND = 0.25;

export function hashFloat(value: number): number {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
}

export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const resolveTriggerMode = (value: unknown): TriggerMode => {
  if (value === "random" || value === "both" || value === "beat") {
    return value;
  }
  return "beat";
};

const generateBoltPath = (rng: () => number, width: number, height: number): BoltPath => {
  const segments = 7 + Math.floor(rng() * 6);
  const startX = rng() * width;
  const endY = height * (0.35 + rng() * 0.45);
  const path: BoltPath = [{ x: startX, y: 0 }];

  let currentX = startX;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const jitter = (rng() - 0.5) * width * 0.15;
    currentX = clamp(currentX + jitter, 0, width);
    path.push({ x: currentX, y: t * endY });
  }
  return path;
};

const generateBoltPaths = (rng: () => number, width: number, height: number, branches: number): BoltPath[] => {
  const primary = generateBoltPath(rng, width, height);
  const paths: BoltPath[] = [primary];
  for (let i = 0; i < branches; i += 1) {
    const branchIndex = 1 + Math.floor(rng() * (primary.length - 2));
    const origin = primary[branchIndex];
    const branchSegments = 3 + Math.floor(rng() * 4);
    const branch: BoltPath = [{ x: origin.x, y: origin.y }];
    let branchX = origin.x;
    const branchEndY = origin.y + (height - origin.y) * (0.2 + rng() * 0.3);
    for (let j = 1; j <= branchSegments; j += 1) {
      const t = j / branchSegments;
      branchX = clamp(branchX + (rng() - 0.5) * width * 0.12, 0, width);
      branch.push({ x: branchX, y: origin.y + t * (branchEndY - origin.y) });
    }
    paths.push(branch);
  }
  return paths;
};

export class LightningEffect implements Effect {
  private lastTriggerTime = -Infinity;
  private flashStartTime = -Infinity;
  private activeUntil = -Infinity;
  private boltPaths: BoltPath[] = [];

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const trigger = resolveTriggerMode(rawParams.trigger);
    const chancePerSecond = Math.max(0, resolveNumberParam(rawParams.chancePerSecond, DEFAULT_CHANCE_PER_SECOND));
    const cooldown = Math.max(0, resolveNumberParam(rawParams.cooldown, DEFAULT_COOLDOWN));
    const flashDuration = Math.max(0.05, resolveNumberParam(rawParams.flashDuration, DEFAULT_FLASH_DURATION));
    const boltEnabled = resolveBooleanParam(rawParams.bolt, true);
    const branches = clamp(Math.floor(resolveNumberParam(rawParams.branches, 1)), 0, 3);
    const seed = resolveNumberParam(rawParams.seed, 0);

    const canTrigger = time - this.lastTriggerTime >= cooldown;
    let triggered = false;

    if (canTrigger && (trigger === "beat" || trigger === "both") && audio.beat) {
      triggered = true;
    }

    if (!triggered && canTrigger && (trigger === "random" || trigger === "both")) {
      const bucket = Math.floor(time * 60);
      const roll = hashFloat(bucket + seed * 31.17);
      if (roll < chancePerSecond / 60) {
        triggered = true;
      }
    }

    if (triggered) {
      this.lastTriggerTime = time;
      this.flashStartTime = time;
      this.activeUntil = time + flashDuration;
      if (boltEnabled) {
        const rng = createRng(Math.floor(seed * 1000 + time * 1000));
        this.boltPaths = generateBoltPaths(rng, width, height, branches);
      } else {
        this.boltPaths = [];
      }
    }

    if (time > this.activeUntil) {
      return;
    }

    const flashAge = time - this.flashStartTime;
    const flashPhase = clamp(1 - flashAge / flashDuration, 0, 1);
    const intensity = clamp(0.4 + audio.rms * 0.8 + audio.beatStrength * 0.6, 0, 1);
    const flashAlpha = flashPhase * (0.35 + intensity * 0.4);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(215, 235, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, width, height);

    if (boltEnabled && this.boltPaths.length > 0) {
      const glowAlpha = flashPhase * (0.5 + intensity * 0.5);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      this.boltPaths.forEach((path) => {
        const drawBolt = (lineWidth: number, alpha: number) => {
          ctx.strokeStyle = `rgba(230, 245, 255, ${alpha})`;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i += 1) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();
        };
        drawBolt(5, glowAlpha * 0.25);
        drawBolt(3, glowAlpha * 0.4);
        drawBolt(1.5, glowAlpha * 0.8);
      });
    }

    ctx.restore();
  }

  reset(): void {
    this.lastTriggerTime = -Infinity;
    this.flashStartTime = -Infinity;
    this.activeUntil = -Infinity;
    this.boltPaths = [];
  }
}
