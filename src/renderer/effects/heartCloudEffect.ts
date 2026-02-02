import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, dot, normalize, projectPoint } from "./simple3d";
import { applyRotation } from "./sphereCloudEffect";

type HeartPoint = Vec3 & { hue: number };

const LIGHT_DIRECTION = normalize({ x: -0.25, y: -0.2, z: -1 });

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 78%, ${lightness}%, ${alpha})`;
}

export function buildHeartCloudPoints(gridSteps = 20, extent = 1.3, threshold = 0.06): HeartPoint[] {
  const points: HeartPoint[] = [];
  const steps = Math.max(8, Math.floor(gridSteps));
  const span = extent * 2;
  const step = span / (steps - 1);

  for (let xi = 0; xi < steps; xi += 1) {
    const x = -extent + xi * step;
    for (let yi = 0; yi < steps; yi += 1) {
      const y = -extent + yi * step;
      for (let zi = 0; zi < steps; zi += 1) {
        const z = -extent + zi * step;
        const equation =
          (x * x + 2.25 * y * y + z * z - 1) ** 3 - x * x * z * z * z - 0.1125 * y * y * z * z * z;
        if (Math.abs(equation) > threshold) {
          continue;
        }
        const normalizedY = (y / extent + 1) / 2;
        const baseHue = 330 - normalizedY * 80 + (z / extent) * 10;
        const hue = clamp(baseHue, 240, 340);
        const scale = 1 / extent;
        points.push({
          x: x * scale,
          y: y * scale,
          z: z * scale,
          hue
        });
      }
    }
  }

  return points;
}

export class HeartCloudEffect implements Effect {
  private points: HeartPoint[] = [];

  constructor(gridSteps = 20) {
    this.points = buildHeartCloudPoints(gridSteps);
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const energy = clamp(audio.bass * 1.05 + audio.treble * 0.4 + audio.rms * 0.35, 0, 1);
    const fov = Math.min(width, height) * 0.92;
    const cameraDistance = 5.2;
    const rotation = {
      x: time * 0.45 * speed + energy * 0.35,
      y: time * 0.6 * speed - energy * 0.25,
      z: time * 0.25 * speed
    };
    const radius = 1.55 + energy * 0.25;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(8, 6, 12)";
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
      const size = clamp(projected.scale * 1.05, 0.5, 3.2);
      const alpha = clamp(0.2 + light * 0.65 + energy * 0.25, 0, 0.95);
      const lightness = 32 + light * 40 + energy * 10;

      ctx.beginPath();
      ctx.fillStyle = colorFromHue(point.hue, lightness, alpha);
      ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(255, 200, 240, 0.03)";
    ctx.fillRect(0, 0, width, height);
  }
}
