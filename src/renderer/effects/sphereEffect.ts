import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, add, normalize, projectPoint, rotateX, rotateY, rotateZ } from "./simple3d";

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

type OrbitingSphereConfig = {
  orbitRadius: number;
  sphereRadius: number;
  tiltX: number;
  tiltZ: number;
  speed: number;
  phase: number;
  hueShift: number;
};

export function buildOrbitingSphereConfigs(): OrbitingSphereConfig[] {
  return [
    {
      orbitRadius: 2.4,
      sphereRadius: 0.35,
      tiltX: Math.PI * 0.18,
      tiltZ: Math.PI * 0.08,
      speed: 0.85,
      phase: 0,
      hueShift: 12
    },
    {
      orbitRadius: 2.9,
      sphereRadius: 0.42,
      tiltX: -Math.PI * 0.12,
      tiltZ: Math.PI * 0.22,
      speed: 0.6,
      phase: Math.PI * 0.66,
      hueShift: -18
    },
    {
      orbitRadius: 3.35,
      sphereRadius: 0.28,
      tiltX: Math.PI * 0.28,
      tiltZ: -Math.PI * 0.16,
      speed: 1.05,
      phase: Math.PI * 1.2,
      hueShift: 24
    }
  ];
}

export function calculateOrbitCenter(time: number, config: OrbitingSphereConfig, speed: number): Vec3 {
  const angle = time * config.speed * speed + config.phase;
  const base = { x: config.orbitRadius, y: 0, z: 0 };
  const orbit = rotateY(base, angle);
  const tiltedX = rotateX(orbit, config.tiltX);
  return rotateZ(tiltedX, config.tiltZ);
}

type SpherePoint = {
  position: Vec3;
  light: number;
  depth: number;
  scale: number;
  hueShift: number;
  alphaScale: number;
  radiusScale: number;
};

export class SphereEffect implements Effect {
  private points = buildSpherePoints(22, 36);
  private orbitingConfigs = buildOrbitingSphereConfigs();
  private orbitingPoints = buildSpherePoints(10, 14);

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

    const projectedPoints: SpherePoint[] = [];

    this.points.forEach((point) => {
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
      if (projected.depth <= 0) {
        return;
      }
      projectedPoints.push({
        position,
        light,
        depth: projected.depth,
        scale: projected.scale,
        hueShift: 0,
        alphaScale: 1,
        radiusScale: 1
      });
    });

    this.orbitingConfigs.forEach((config) => {
      const orbitCenter = calculateOrbitCenter(time, config, speed);
      const center = {
        x: orbitCenter.x * pulse,
        y: orbitCenter.y * pulse,
        z: orbitCenter.z * pulse
      };
      const spin = {
        x: rotation.x * 1.1,
        y: rotation.y * 1.1,
        z: rotation.z * 1.1
      };
      this.orbitingPoints.forEach((point) => {
        const local = {
          x: point.x * config.sphereRadius,
          y: point.y * config.sphereRadius,
          z: point.z * config.sphereRadius
        };
        const rotatedX = rotateX(local, spin.x);
        const rotatedY = rotateY(rotatedX, spin.y);
        const rotated = rotateZ(rotatedY, spin.z);
        const position = add(center, rotated);
        const normal = normalize(rotated);
        const light = clamp(normal.x * LIGHT_DIRECTION.x + normal.y * LIGHT_DIRECTION.y + normal.z * LIGHT_DIRECTION.z, 0, 1);
        const projected = projectPoint(position, cameraDistance, fov, width, height);
        if (projected.depth <= 0) {
          return;
        }
        projectedPoints.push({
          position,
          light,
          depth: projected.depth,
          scale: projected.scale,
          hueShift: config.hueShift,
          alphaScale: 0.85,
          radiusScale: 0.8
        });
      });
    });

    projectedPoints.sort((a, b) => b.depth - a.depth);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    projectedPoints.forEach((point) => {
      const projected = projectPoint(point.position, cameraDistance, fov, width, height);
      const radius = clamp(1.2 * point.scale * point.radiusScale, 0.45, 4.5);
      const hue = 190 + point.light * 120 + energy * 25 + point.hueShift;
      const lightness = 35 + point.light * 40 + energy * 10;
      const alpha = clamp((0.35 + point.light * 0.5) * point.alphaScale, 0, 0.9);

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
