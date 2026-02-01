import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, normalize, projectPoint, rotateX, rotateY, rotateZ } from "./simple3d";

const LIGHT_DIRECTION = normalize({ x: -0.3, y: -0.4, z: -1 });

export function buildSpherePoints(latitudeBands: number, longitudeBands: number): Vec3[] {
  const points: Vec3[] = [];
  const latSteps = Math.max(2, Math.floor(latitudeBands));
  const lonSteps = Math.max(3, Math.floor(longitudeBands));

  for (let lat = 0; lat <= latSteps; lat += 1) {
    const theta = (lat / latSteps) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon < lonSteps; lon += 1) {
      const phi = (lon / lonSteps) * Math.PI * 2;
      points.push({
        x: Math.cos(phi) * sinTheta,
        y: cosTheta,
        z: Math.sin(phi) * sinTheta
      });
    }
  }

  return points;
}

type SpherePoint = {
  position: Vec3;
  light: number;
  depth: number;
  scale: number;
};

export class SphereEffect implements Effect {
  private points = buildSpherePoints(22, 36);

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1;
    const energy = clamp(audio.bass * 1.1 + audio.mid * 0.6, 0, 1);
    const fov = Math.min(width, height) * 0.9;
    const cameraDistance = 5.4;
    const rotation = {
      x: time * 0.35 * speed,
      y: time * 0.55 * speed,
      z: time * 0.15 * speed
    };
    const pulse = 1 + energy * 0.08;

    ctx.clearRect(0, 0, width, height);
    const background = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      0,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.8
    );
    background.addColorStop(0, "rgba(6, 10, 18, 0.95)");
    background.addColorStop(1, "rgba(2, 4, 8, 0.95)");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const projectedPoints: SpherePoint[] = this.points
      .map((point) => {
        const rotatedX = rotateX(point, rotation.x);
        const rotatedY = rotateY(rotatedX, rotation.y);
        const rotated = rotateZ(rotatedY, rotation.z);
        const position = {
          x: rotated.x * pulse,
          y: rotated.y * pulse,
          z: rotated.z * pulse
        };
        const normal = normalize(position);
        const light = clamp(normal.x * LIGHT_DIRECTION.x + normal.y * LIGHT_DIRECTION.y + normal.z * LIGHT_DIRECTION.z, 0, 1);
        const projected = projectPoint(position, cameraDistance, fov, width, height);
        return {
          position,
          light,
          depth: projected.depth,
          scale: projected.scale
        };
      })
      .filter((point) => point.depth > 0)
      .sort((a, b) => b.depth - a.depth);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    projectedPoints.forEach((point) => {
      const projected = projectPoint(point.position, cameraDistance, fov, width, height);
      const radius = clamp(1.2 * point.scale, 0.6, 4.5);
      const hue = 190 + point.light * 120 + energy * 25;
      const lightness = 35 + point.light * 40 + energy * 10;
      const alpha = clamp(0.35 + point.light * 0.5, 0, 0.9);

      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
      ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.strokeStyle = "rgba(140, 200, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.17, 0, Math.PI * 2);
    ctx.stroke();
  }
}
