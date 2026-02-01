import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, dot, normalize, projectPoint, rotateX, rotateY, rotateZ } from "./simple3d";

type SpherePoint = Vec3 & { hue: number };

const LIGHT_DIRECTION = normalize({ x: -0.3, y: -0.2, z: -1 });

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
}

export function applyRotation(point: Vec3, rotation: Vec3): Vec3 {
  const rotatedX = rotateX(point, rotation.x);
  const rotatedY = rotateY(rotatedX, rotation.y);
  return rotateZ(rotatedY, rotation.z);
}

export function buildSphereCloudPoints(latSegments = 18, lonSegments = 36): SpherePoint[] {
  const points: SpherePoint[] = [];
  const latSteps = Math.max(2, Math.floor(latSegments));
  const lonSteps = Math.max(3, Math.floor(lonSegments));

  for (let lat = 0; lat <= latSteps; lat += 1) {
    const v = lat / latSteps;
    const theta = v * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let lon = 0; lon < lonSteps; lon += 1) {
      const u = lon / lonSteps;
      const phi = u * Math.PI * 2;
      points.push({
        x: Math.cos(phi) * sinTheta,
        y: cosTheta,
        z: Math.sin(phi) * sinTheta,
        hue: 190 + v * 140
      });
    }
  }
  return points;
}

export class SphereCloudEffect implements Effect {
  private points: SpherePoint[] = [];

  constructor(latSegments = 18, lonSegments = 36) {
    this.points = buildSphereCloudPoints(latSegments, lonSegments);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const energy = clamp(audio.bass * 1.1 + audio.treble * 0.5 + audio.rms * 0.3, 0, 1);
    const fov = Math.min(width, height) * 0.9;
    const cameraDistance = 5.4;
    const rotation = {
      x: time * 0.5 * speed + energy * 0.6,
      y: time * 0.7 * speed + energy * 0.4,
      z: time * 0.2 * speed
    };
    const radius = 1.6 + energy * 0.25;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(4, 8, 16)";
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
      const light = clamp(dot(normal, LIGHT_DIRECTION), 0.05, 1);
      const projected = projectPoint(rotated, cameraDistance, fov, width, height);
      if (projected.depth <= 0) {
        return;
      }
      const size = clamp(projected.scale * 0.9, 0.4, 2.8);
      const alpha = clamp(0.15 + light * 0.7 + energy * 0.2, 0, 0.95);
      const lightness = 30 + light * 45 + energy * 12;

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
