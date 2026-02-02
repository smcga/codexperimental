import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, dot, normalize, projectPoint } from "./simple3d";
import { applyRotation } from "./sphereCloudEffect";

type HandPoint = Vec3 & { hue: number; normal: Vec3; seed: number };

type Bounds = { min: Vec3; max: Vec3 };

type Grid = { x: number; y: number; z: number };

const LIGHT_DIRECTION = normalize({ x: -0.25, y: -0.15, z: -1 });
const HAND_BOUNDS: Bounds = {
  min: { x: -1.8, y: -0.9, z: -0.9 },
  max: { x: 1.2, y: 2.2, z: 0.9 }
};
const HAND_GRID: Grid = { x: 48, y: 56, z: 40 };
const HAND_THRESHOLD = 0.041;
const NORMAL_EPSILON = 0.015;

const fingerBases = [
  { x: -0.25, y: 0.35, z: 0 },
  { x: 0.05, y: 0.38, z: 0 },
  { x: 0.33, y: 0.34, z: 0 },
  { x: 0.58, y: 0.28, z: 0 }
];
const fingerTips = [
  { x: -0.25, y: 1.75, z: 0 },
  { x: 0.05, y: 1.9, z: 0 },
  { x: 0.33, y: 1.75, z: 0 },
  { x: 0.58, y: 1.5, z: 0 }
];
const fingerRadii = [0.18, 0.19, 0.17, 0.14];

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function mulScalar(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function absVec(v: Vec3): Vec3 {
  return { x: Math.abs(v.x), y: Math.abs(v.y), z: Math.abs(v.z) };
}

function maxVec(v: Vec3, minValue: number): Vec3 {
  return { x: Math.max(v.x, minValue), y: Math.max(v.y, minValue), z: Math.max(v.z, minValue) };
}

function lengthVec(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

function sdSphere(p: Vec3, radius: number): number {
  return lengthVec(p) - radius;
}

function sdCapsule(p: Vec3, a: Vec3, b: Vec3, radius: number): number {
  const pa = sub(p, a);
  const ba = sub(b, a);
  const h = clamp(dot(pa, ba) / dot(ba, ba), 0, 1);
  return lengthVec(sub(pa, mulScalar(ba, h))) - radius;
}

function sdRoundBox(p: Vec3, bounds: Vec3, radius: number): number {
  const q = sub(absVec(p), bounds);
  const outside = lengthVec(maxVec(q, 0));
  const inside = Math.min(Math.max(q.x, Math.max(q.y, q.z)), 0);
  return outside + inside - radius;
}

function opSmoothUnion(d1: number, d2: number, k: number): number {
  const h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0, 1);
  return lerp(d2, d1, h) - k * h * (1 - h);
}

function sdHand(p: Vec3, gesture: number): number {
  const palmCenter = { x: 0, y: -0.05, z: 0 };
  const palm = sdRoundBox(sub(p, palmCenter), { x: 0.9, y: 0.55, z: 0.35 }, 0.25);
  const thenar = sdSphere(sub(p, { x: -0.65, y: -0.05, z: 0.05 }), 0.45);
  let hand = opSmoothUnion(palm, thenar, 0.32);

  const curlAmount = gesture * 0.25;
  fingerBases.forEach((base, index) => {
    const tipBase = fingerTips[index];
    const tip = {
      x: tipBase.x,
      y: tipBase.y - curlAmount * (0.6 + index * 0.1),
      z: tipBase.z + curlAmount * 0.2
    };
    const radius = fingerRadii[index];
    const finger = sdCapsule(p, base, tip, radius);
    const tipSphere = sdSphere(sub(p, tip), radius * 0.9);
    hand = opSmoothUnion(hand, opSmoothUnion(finger, tipSphere, 0.18), 0.28);
  });

  const thumbBase = { x: -0.75, y: 0.05, z: 0.05 };
  const thumbTip = {
    x: -1.25,
    y: 0.85 - gesture * 0.15,
    z: 0.05 + gesture * 0.1
  };
  const thumb = sdCapsule(p, thumbBase, thumbTip, 0.2);
  const thumbTipSphere = sdSphere(sub(p, thumbTip), 0.18);
  hand = opSmoothUnion(hand, opSmoothUnion(thumb, thumbTipSphere, 0.2), 0.28);

  return hand;
}

function estimateNormal(p: Vec3): Vec3 {
  const dx = sdHand({ x: p.x + NORMAL_EPSILON, y: p.y, z: p.z }, 0) -
    sdHand({ x: p.x - NORMAL_EPSILON, y: p.y, z: p.z }, 0);
  const dy = sdHand({ x: p.x, y: p.y + NORMAL_EPSILON, z: p.z }, 0) -
    sdHand({ x: p.x, y: p.y - NORMAL_EPSILON, z: p.z }, 0);
  const dz = sdHand({ x: p.x, y: p.y, z: p.z + NORMAL_EPSILON }, 0) -
    sdHand({ x: p.x, y: p.y, z: p.z - NORMAL_EPSILON }, 0);
  return normalize({ x: dx, y: dy, z: dz });
}

function hash3(i: number, j: number, k: number): number {
  let n = (i * 73856093) ^ (j * 19349663) ^ (k * 83492791);
  n = (n << 13) ^ n;
  const nn = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
  return (1.0 - nn / 1073741824.0) * 0.5 + 0.5;
}

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
}

export function buildHandCloudPoints(): HandPoint[] {
  const points: HandPoint[] = [];
  const gridX = HAND_GRID.x;
  const gridY = HAND_GRID.y;
  const gridZ = HAND_GRID.z;

  for (let ix = 0; ix <= gridX; ix += 1) {
    const x = lerp(HAND_BOUNDS.min.x, HAND_BOUNDS.max.x, ix / gridX);
    for (let iy = 0; iy <= gridY; iy += 1) {
      const y = lerp(HAND_BOUNDS.min.y, HAND_BOUNDS.max.y, iy / gridY);
      for (let iz = 0; iz <= gridZ; iz += 1) {
        const z = lerp(HAND_BOUNDS.min.z, HAND_BOUNDS.max.z, iz / gridZ);
        const point = { x, y, z };
        const distance = sdHand(point, 0);
        if (Math.abs(distance) > HAND_THRESHOLD) {
          continue;
        }
        const seed = hash3(ix, iy, iz);
        if (seed <= 1) {
          const hue = 200 + clamp((y + 0.8) / 2.8, 0, 1) * 140;
          points.push({
            ...point,
            hue,
            normal: estimateNormal(point),
            seed
          });
        }
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
    const energy = clamp(audio.bass * 1.1 + audio.treble * 0.5 + audio.rms * 0.3, 0, 1);
    const density = clamp(params.density ?? 1.0, 0.25, 1.0);
    const gesture = clamp(params.gesture ?? energy * 0.6, 0, 1);
    const baseScale = (params.scale ?? 1.0) * 1.5;
    const scale = baseScale + energy * 0.2;
    const fov = Math.min(width, height) * 0.92;
    const cameraDistance = 5.6;
    const rotation = {
      x: time * 0.5 * speed + energy * 0.6 + gesture * 0.2,
      y: time * 0.7 * speed + energy * 0.4 - gesture * 0.15,
      z: time * 0.2 * speed
    };

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(4, 8, 16)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    this.points.forEach((point) => {
      if (point.seed > density) {
        return;
      }
      const rotated = applyRotation(
        {
          x: point.x * scale,
          y: point.y * scale,
          z: point.z * scale
        },
        rotation
      );
      const rotatedNormal = normalize(applyRotation(point.normal, rotation));
      const light = clamp(dot(rotatedNormal, LIGHT_DIRECTION), 0.05, 1);
      const projected = projectPoint(rotated, cameraDistance, fov, width, height);
      if (projected.depth <= 0) {
        return;
      }

      const size = clamp(projected.scale * 0.85, 0.35, 2.8);
      const alpha = clamp(0.12 + light * 0.72 + energy * 0.2, 0, 0.95);
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
