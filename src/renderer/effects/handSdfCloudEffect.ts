import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, dot, normalize, projectPoint } from "./simple3d";
import { applyRotation } from "./sphereCloudEffect";

type HandPoint = Vec3 & { normal: Vec3; hue: number; seed: number };

type Bounds = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
};

const LIGHT_DIRECTION = normalize({ x: -0.3, y: -0.2, z: -1 });
const HAND_BOUNDS: Bounds = {
  xMin: -1.8,
  xMax: 1.2,
  yMin: -0.8,
  yMax: 2.2,
  zMin: -0.9,
  zMax: 0.9
};
const GRID_STEPS = { x: 44, y: 56, z: 30 };
const SURFACE_THRESHOLD = 0.05;

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function mulScalar(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function absVec3(v: Vec3): Vec3 {
  return { x: Math.abs(v.x), y: Math.abs(v.y), z: Math.abs(v.z) };
}

function maxVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y), z: Math.max(a.z, b.z) };
}

function length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function sdSphere(p: Vec3, r: number): number {
  return length(p) - r;
}

function sdRoundBox(p: Vec3, b: Vec3, r: number): number {
  const q = sub(absVec3(p), b);
  const outside = length(maxVec3(q, { x: 0, y: 0, z: 0 }));
  const inside = Math.min(Math.max(q.x, Math.max(q.y, q.z)), 0);
  return outside + inside - r;
}

function sdCapsule(p: Vec3, a: Vec3, b: Vec3, r: number): number {
  const pa = sub(p, a);
  const ba = sub(b, a);
  const h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1);
  return length(sub(pa, mulScalar(ba, h))) - r;
}

function opSmoothUnion(d1: number, d2: number, k: number): number {
  const h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0, 1);
  return lerp(d2, d1, h) - k * h * (1 - h);
}

function opUnion(d1: number, d2: number): number {
  return Math.min(d1, d2);
}

function sdFinger(p: Vec3, base: Vec3, tip: Vec3, radius: number): number {
  const shaft = sdCapsule(p, base, tip, radius);
  const fingertip = sdSphere(sub(p, tip), radius * 1.05);
  return opSmoothUnion(shaft, fingertip, radius * 0.35);
}

function sdHand(p: Vec3, gesture = 0): number {
  const palm = sdRoundBox(sub(p, { x: 0.05, y: 0, z: 0 }), { x: 0.9, y: 0.55, z: 0.35 }, 0.25);
  const thenar = sdSphere(sub(p, { x: -0.65, y: -0.05, z: 0.05 }), 0.45);
  let d = opSmoothUnion(palm, thenar, 0.28);

  const curl = gesture * 0.35;
  const forward = gesture * 0.18;
  const fingers = [
    { base: { x: -0.25, y: 0.35, z: 0 }, tip: { x: -0.25, y: 1.75, z: 0 }, r: 0.18 },
    { base: { x: 0.05, y: 0.38, z: 0 }, tip: { x: 0.05, y: 1.9, z: 0 }, r: 0.19 },
    { base: { x: 0.33, y: 0.34, z: 0 }, tip: { x: 0.33, y: 1.75, z: 0 }, r: 0.17 },
    { base: { x: 0.58, y: 0.28, z: 0 }, tip: { x: 0.58, y: 1.5, z: 0 }, r: 0.14 }
  ];

  fingers.forEach((finger, index) => {
    const tip = {
      x: finger.tip.x,
      y: finger.tip.y - curl * (1 + index * 0.15),
      z: finger.tip.z + forward
    };
    const fingerDistance = sdFinger(p, finger.base, tip, finger.r);
    d = opSmoothUnion(d, fingerDistance, 0.22);
  });

  const thumbBase = { x: -0.75, y: 0.05, z: 0.05 };
  const thumbTip = { x: -1.25, y: 0.85, z: 0.05 };
  const thumb = sdFinger(p, thumbBase, thumbTip, 0.2);
  const thumbPad = sdCapsule(p, { x: -0.55, y: -0.1, z: 0.05 }, { x: -0.95, y: 0.4, z: 0.05 }, 0.26);
  d = opSmoothUnion(d, thumb, 0.25);
  d = opSmoothUnion(d, thumbPad, 0.25);

  return d;
}

function estimateNormal(p: Vec3): Vec3 {
  const eps = 0.015;
  const dx = sdHand(add(p, { x: eps, y: 0, z: 0 })) - sdHand(add(p, { x: -eps, y: 0, z: 0 }));
  const dy = sdHand(add(p, { x: 0, y: eps, z: 0 })) - sdHand(add(p, { x: 0, y: -eps, z: 0 }));
  const dz = sdHand(add(p, { x: 0, y: 0, z: eps })) - sdHand(add(p, { x: 0, y: 0, z: -eps }));
  return normalize({ x: dx, y: dy, z: dz });
}

function hash3(i: number, j: number, k: number): number {
  let n = i * 73856093 ^ j * 19349663 ^ k * 83492791;
  n = (n << 13) ^ n;
  const nn = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  return nn / 0x7fffffff;
}

export function buildHandCloudPoints(): HandPoint[] {
  const points: HandPoint[] = [];
  const { xMin, xMax, yMin, yMax, zMin, zMax } = HAND_BOUNDS;
  const xSteps = Math.max(8, GRID_STEPS.x);
  const ySteps = Math.max(8, GRID_STEPS.y);
  const zSteps = Math.max(8, GRID_STEPS.z);

  for (let xi = 0; xi <= xSteps; xi += 1) {
    const x = lerp(xMin, xMax, xi / xSteps);
    for (let yi = 0; yi <= ySteps; yi += 1) {
      const y = lerp(yMin, yMax, yi / ySteps);
      for (let zi = 0; zi <= zSteps; zi += 1) {
        const z = lerp(zMin, zMax, zi / zSteps);
        const p = { x, y, z };
        const distance = sdHand(p, 0);
        if (Math.abs(distance) > SURFACE_THRESHOLD) {
          continue;
        }
        const seed = hash3(xi, yi, zi);
        const normal = estimateNormal(p);
        points.push({
          x,
          y,
          z,
          normal,
          seed,
          hue: 180 + (y - yMin) / (yMax - yMin) * 160
        });
      }
    }
  }
  return points;
}

export class HandSdfCloudEffect implements Effect {
  private points: HandPoint[] = [];

  constructor() {
    this.points = buildHandCloudPoints();
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const density = clamp(params.density ?? 1.0, 0.2, 1.5);
    const energy = clamp(audio.bass * 1.1 + audio.treble * 0.5 + audio.rms * 0.3, 0, 1);
    const fov = Math.min(width, height) * 0.9;
    const cameraDistance = 6.2;
    const rotation = {
      x: time * 0.5 * speed + energy * 0.6,
      y: time * 0.7 * speed + energy * 0.4,
      z: time * 0.2 * speed
    };
    const baseScale = (params.scale ?? 1.0) * 1.5;
    const scale = baseScale + energy * 0.2;
    const densityThreshold = clamp(density / 1.2, 0.2, 1.2);
    const gesture = clamp(params.gesture ?? energy * 0.6, 0, 1);
    const glowBoost = 0.1 + gesture * 0.15;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(4, 8, 16)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    this.points.forEach((point) => {
      if (point.seed > densityThreshold) {
        return;
      }
      const scaled = mulScalar(point, scale);
      const rotated = applyRotation(scaled, rotation);
      const rotatedNormal = applyRotation(point.normal, rotation);
      const light = clamp(dot(rotatedNormal, LIGHT_DIRECTION), 0.05, 1);
      const projected = projectPoint(rotated, cameraDistance, fov, width, height);
      if (projected.depth <= 0) {
        return;
      }
      const size = clamp(projected.scale * 0.85, 0.35, 2.8);
      const alpha = clamp(0.12 + light * 0.72 + energy * 0.2 + glowBoost, 0, 0.95);
      const lightness = 28 + light * 48 + energy * 12;

      ctx.beginPath();
      ctx.fillStyle = colorFromHue(point.hue, lightness, alpha);
      ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.fillRect(0, 0, width, height);
  }
}

export const handCloudBounds = HAND_BOUNDS;
