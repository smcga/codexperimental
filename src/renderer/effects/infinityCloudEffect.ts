import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, cross, dot, normalize, projectPoint } from "./simple3d";
import { applyRotation } from "./sphereCloudEffect";

type InfinityPoint = Vec3 & { hue: number; phase: number };

const LIGHT_DIRECTION = normalize({ x: -0.3, y: -0.1, z: -1 });

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 78%, ${lightness}%, ${alpha})`;
}

function scale(vec: Vec3, scalar: number): Vec3 {
  return {
    x: vec.x * scalar,
    y: vec.y * scalar,
    z: vec.z * scalar
  };
}

function add(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z
  };
}

function infinityCenter(t: number): Vec3 {
  const denom = 1 + Math.sin(t) ** 2;
  const a = 1.25;
  return {
    x: (a * Math.cos(t)) / denom,
    y: (a * Math.sin(t) * Math.cos(t)) / denom,
    z: Math.sin(t) * 0.35
  };
}

export function buildInfinityCloudPoints(segments = 160, tubeSegments = 12): InfinityPoint[] {
  const points: InfinityPoint[] = [];
  const curveSteps = Math.max(20, Math.floor(segments));
  const tubeSteps = Math.max(6, Math.floor(tubeSegments));
  const delta = 0.0008;

  for (let i = 0; i < curveSteps; i += 1) {
    const t = (i / curveSteps) * Math.PI * 2;
    const center = infinityCenter(t);
    const next = infinityCenter(t + delta);
    let tangent = normalize({
      x: next.x - center.x,
      y: next.y - center.y,
      z: next.z - center.z
    });
    if (!Number.isFinite(tangent.x) || !Number.isFinite(tangent.y) || !Number.isFinite(tangent.z)) {
      tangent = { x: 1, y: 0, z: 0 };
    }

    let normal = cross(tangent, { x: 0, y: 1, z: 0 });
    if (Math.hypot(normal.x, normal.y, normal.z) < 0.001) {
      normal = cross(tangent, { x: 1, y: 0, z: 0 });
    }
    normal = normalize(normal);
    const binormal = normalize(cross(normal, tangent));

    for (let j = 0; j < tubeSteps; j += 1) {
      const u = (j / tubeSteps) * Math.PI * 2;
      const wobble = 0.15 * Math.sin(t * 2 + u);
      const tubeRadius = 0.28 + wobble * 0.05;
      const offset = add(
        scale(normal, Math.cos(u) * tubeRadius),
        scale(binormal, Math.sin(u) * tubeRadius)
      );
      const point = add(center, offset);
      points.push({
        x: point.x,
        y: point.y,
        z: point.z,
        hue: 210 + (t / (Math.PI * 2)) * 120,
        phase: t + u
      });
    }
  }

  return points;
}

export class InfinityCloudEffect implements Effect {
  private points: InfinityPoint[] = [];

  constructor(segments = 160, tubeSegments = 12) {
    this.points = buildInfinityCloudPoints(segments, tubeSegments);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const energy = clamp(audio.bass * 1.1 + audio.treble * 0.4 + audio.rms * 0.4, 0, 1);
    const fov = Math.min(width, height) * 0.9;
    const cameraDistance = 5.2;
    const rotation = {
      x: time * 0.4 * speed + energy * 0.5,
      y: time * 0.6 * speed + energy * 0.35,
      z: time * 0.2 * speed
    };
    const radius = 1.8 + energy * 0.2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(6, 8, 18)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    this.points.forEach((point) => {
      const rotated = applyRotation(
        {
          x: point.x * radius,
          y: point.y * radius,
          z: point.z * radius
        },
        rotation
      );
      const normal = normalize(rotated);
      const light = clamp(dot(normal, LIGHT_DIRECTION), 0.08, 1);
      const projected = projectPoint(rotated, cameraDistance, fov, width, height);
      if (projected.depth <= 0) {
        return;
      }
      const pulse = 0.12 * Math.sin(time * 1.5 + point.phase);
      const size = clamp(projected.scale * (0.75 + pulse + energy * 0.25), 0.45, 3.0);
      const alpha = clamp(0.12 + light * 0.65 + energy * 0.2, 0, 0.9);
      const lightness = 28 + light * 50 + energy * 10;

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
