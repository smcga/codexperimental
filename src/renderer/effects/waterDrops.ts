import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const WATER_DROPS_DEFAULTS = {
  seed: 1,
  density: 0.8,
  size: 1,
  speed: 0.25,
  dripRate: 0.15,
  opacity: 0.35,
  highlight: 1,
  rim: 1,
  streaks: 0.6,
  distort: 0,
  distortScale: 0.5
} as const;

const BASE_DROPLET_COUNT = 180;
const MAX_DROPLETS = 420;
const MIN_RADIUS_NORM = 0.0022;

type DropletType = "static" | "drip";

export type WaterDroplet = {
  x: number;
  y: number;
  r: number;
  vy: number;
  type: DropletType;
  phase: number;
  wobble: number;
};

type WaterDropsState = {
  seededState: number;
  droplets: WaterDroplet[];
  lastTime: number;
  frameCount: number;
  width: number;
  height: number;
  offscreen: HTMLCanvasElement | null;
  offscreenCtx: CanvasRenderingContext2D | null;
};

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const createLcg = (seed: number): (() => number) => {
  let state = (Math.floor(seed) ^ 0xa341316c) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const radiusFor = (rng: () => number, size: number, minDim: number): number => {
  const bandRoll = rng();
  const basePx = bandRoll < 0.78 ? 2.5 + rng() * 6.5 : 8 + rng() * 11;
  return Math.max((basePx * size) / minDim, MIN_RADIUS_NORM);
};

export const spawnDroplet = (
  rng: () => number,
  minDim: number,
  params: { dripRate: number; size: number; speed: number },
  y = rng()
): WaterDroplet => {
  const r = radiusFor(rng, params.size, minDim);
  const isDrip = rng() < params.dripRate;
  return {
    x: rng(),
    y,
    r,
    vy: (0.006 + rng() * 0.02 + (isDrip ? 0.012 : 0)) * Math.max(0.05, params.speed),
    type: isDrip ? "drip" : "static",
    phase: rng() * Math.PI * 2,
    wobble: (rng() - 0.5) * 0.35
  };
};

export const initializeDroplets = (
  seed: number,
  count: number,
  minDim: number,
  params: { dripRate: number; size: number; speed: number }
): WaterDroplet[] => {
  const rng = createLcg(seed);
  const droplets: WaterDroplet[] = [];
  for (let i = 0; i < count; i += 1) {
    droplets.push(spawnDroplet(rng, minDim, params));
  }
  return droplets;
};

export const stepDroplets = (
  droplets: WaterDroplet[],
  dt: number,
  rng: () => number,
  minDim: number,
  params: { dripRate: number; size: number; speed: number }
): void => {
  for (let i = 0; i < droplets.length; i += 1) {
    const droplet = droplets[i];
    droplet.phase += dt * (0.6 + droplet.wobble * 0.2);
    const wobbleDrift = Math.sin(droplet.phase) * droplet.wobble * dt * 0.08;
    droplet.x = (droplet.x + wobbleDrift + 1) % 1;
    droplet.y += droplet.vy * dt;

    if (droplet.y - droplet.r > 1.06) {
      droplets[i] = spawnDroplet(rng, minDim, params, -droplet.r * (0.5 + rng() * 1.5));
    }
  }
};

const ensureOffscreen = (
  state: WaterDropsState,
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const targetW = Math.max(32, Math.floor(width / 4));
  const targetH = Math.max(32, Math.floor(height / 4));

  if (!state.offscreen || state.offscreen.width !== targetW || state.offscreen.height !== targetH || !state.offscreenCtx) {
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const offscreenCtx = canvas.getContext("2d");
    if (!offscreenCtx) {
      return null;
    }
    state.offscreen = canvas;
    state.offscreenCtx = offscreenCtx;
  }

  return state.offscreen && state.offscreenCtx ? { canvas: state.offscreen, ctx: state.offscreenCtx } : null;
};

// Example timeline layer usage:
// {
//   "effect": "waterDrops",
//   "blend": "screen",
//   "opacity": 0.35,
//   "params": { "seed": 2, "density": 0.9, "size": 1.1, "speed": 0.2, "dripRate": 0.2, "streaks": 0.7 }
// }
export class WaterDropsEffect implements Effect {
  private state: WaterDropsState | null = null;

  private ensureState(width: number, height: number, seed: number, density: number, size: number, speed: number, dripRate: number): void {
    const minDim = Math.max(1, Math.min(width, height));
    const targetCount = clamp(Math.round(BASE_DROPLET_COUNT * density * Math.sqrt((width * height) / (1280 * 720))), 24, MAX_DROPLETS);

    if (
      !this.state ||
      this.state.seededState !== seed ||
      this.state.droplets.length !== targetCount ||
      this.state.width !== width ||
      this.state.height !== height
    ) {
      this.state = {
        seededState: seed,
        droplets: initializeDroplets(seed, targetCount, minDim, { dripRate, size, speed }),
        lastTime: Number.NaN,
        frameCount: 0,
        width,
        height,
        offscreen: null,
        offscreenCtx: null
      };
    }
  }

  render({ ctx, width, height, time, delta, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const seed = resolveNumberParam(rawParams.seed, WATER_DROPS_DEFAULTS.seed);
    const density = clamp(resolveNumberParam(rawParams.density, WATER_DROPS_DEFAULTS.density), 0, 2.4);
    const size = clamp(resolveNumberParam(rawParams.size, WATER_DROPS_DEFAULTS.size), 0.2, 2.4);
    const speed = clamp(resolveNumberParam(rawParams.speed, WATER_DROPS_DEFAULTS.speed), 0, 3);
    const dripRate = clamp(resolveNumberParam(rawParams.dripRate, WATER_DROPS_DEFAULTS.dripRate), 0, 1);
    const baseOpacity = clamp(resolveNumberParam(rawParams.opacity, WATER_DROPS_DEFAULTS.opacity), 0, 1);
    const highlight = clamp(resolveNumberParam(rawParams.highlight, WATER_DROPS_DEFAULTS.highlight), 0, 2.5);
    const rim = clamp(resolveNumberParam(rawParams.rim, WATER_DROPS_DEFAULTS.rim), 0, 2.5);
    const streaks = clamp(resolveNumberParam(rawParams.streaks, WATER_DROPS_DEFAULTS.streaks), 0, 1);
    const distort = clamp(resolveNumberParam(rawParams.distort, WATER_DROPS_DEFAULTS.distort), 0, 1);
    const distortScale = clamp(resolveNumberParam(rawParams.distortScale, WATER_DROPS_DEFAULTS.distortScale), 0, 2);

    this.ensureState(width, height, seed, density, size, speed, dripRate);
    if (!this.state) {
      return;
    }

    const state = this.state;
    const minDim = Math.max(1, Math.min(width, height));
    const rng = createLcg(seed + state.frameCount * 4093);

    let dt = Number.isFinite(delta) && delta > 0 ? delta : 1 / 60;
    if (Number.isFinite(state.lastTime)) {
      const impliedDt = Math.max(0, time - state.lastTime);
      if (impliedDt > 0 && impliedDt < 0.25) {
        dt = impliedDt;
      }
    }
    dt = clamp(dt, 1 / 120, 0.1);
    state.lastTime = time;

    stepDroplets(state.droplets, dt * 60, rng, minDim, { dripRate, size, speed });

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha *= baseOpacity;

    for (const droplet of state.droplets) {
      const cx = droplet.x * width;
      const cy = droplet.y * height;
      const rx = droplet.r * minDim;
      const elongation = droplet.type === "drip" ? 1 + 0.8 * streaks : 1;
      const ry = rx * elongation;

      ctx.fillStyle = `rgba(180, 195, 215, ${0.08 + 0.08 * baseOpacity})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      const rimGradient = ctx.createRadialGradient(cx, cy, rx * 0.22, cx, cy, rx * 1.1);
      rimGradient.addColorStop(0, `rgba(255,255,255,${0.03 * rim})`);
      rimGradient.addColorStop(0.72, `rgba(80,90,110,${0.07 * rim})`);
      rimGradient.addColorStop(1, `rgba(18,22,32,${0.2 * rim})`);
      ctx.fillStyle = rimGradient;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(16, 19, 30, ${0.17 * rim})`;
      ctx.lineWidth = Math.max(0.4, rx * 0.08);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      const hx = cx - rx * 0.35;
      const hy = cy - ry * 0.35;
      const hrx = Math.max(0.5, rx * 0.35);
      const hry = Math.max(0.4, ry * 0.26);
      const highlightGradient = ctx.createRadialGradient(hx, hy, hrx * 0.05, hx, hy, hrx);
      highlightGradient.addColorStop(0, `rgba(255,255,255,${0.45 * highlight})`);
      highlightGradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlightGradient;
      ctx.beginPath();
      ctx.ellipse(hx, hy, hrx, hry, -0.45, 0, Math.PI * 2);
      ctx.fill();

      if (droplet.type === "drip" && streaks > 0) {
        const streakLen = ry * (1.2 + streaks * 3.2);
        const gradient = ctx.createLinearGradient(cx, cy + ry * 0.6, cx, cy + streakLen);
        gradient.addColorStop(0, `rgba(205, 215, 235, ${0.14 * streaks})`);
        gradient.addColorStop(1, "rgba(205, 215, 235, 0)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(0.35, rx * 0.12);
        ctx.beginPath();
        ctx.moveTo(cx, cy + ry * 0.45);
        ctx.lineTo(cx + droplet.wobble * rx * 0.25, cy + streakLen);
        ctx.stroke();
      }
    }

    if (distort > 0 && ctx.canvas) {
      try {
        const offscreen = ensureOffscreen(state, width, height);
        if (offscreen) {
          if (state.frameCount % 3 === 0) {
            offscreen.ctx.clearRect(0, 0, offscreen.canvas.width, offscreen.canvas.height);
            offscreen.ctx.drawImage(ctx.canvas, 0, 0, offscreen.canvas.width, offscreen.canvas.height);
          }

          const smearAlpha = 0.035 * distort;
          for (let i = 0; i < state.droplets.length; i += 3) {
            const droplet = state.droplets[i];
            const patchRadius = Math.max(1, droplet.r * minDim * 0.45);
            const sx = clamp((droplet.x * offscreen.canvas.width) - patchRadius, 0, offscreen.canvas.width - patchRadius * 2);
            const sy = clamp((droplet.y * offscreen.canvas.height) - patchRadius, 0, offscreen.canvas.height - patchRadius * 2);
            const dx = droplet.x * width - patchRadius;
            const dy = droplet.y * height - patchRadius;
            const shift = distortScale * (0.5 + droplet.wobble) * 3;

            ctx.globalAlpha = smearAlpha;
            ctx.drawImage(
              offscreen.canvas,
              sx,
              sy,
              patchRadius * 2,
              patchRadius * 2,
              dx + shift,
              dy + shift,
              patchRadius * 2,
              patchRadius * 2
            );
          }
          ctx.globalAlpha = baseOpacity;
        }
      } catch {
        // Distortion is optional; silently skip if the drawing context disallows it.
      }
    }

    ctx.restore();
    state.frameCount += 1;
  }

  reset(): void {
    this.state = null;
  }
}
