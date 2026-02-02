import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { Vec3, cross, dot, normalize, projectPoint } from "./simple3d";
import { applyRotation } from "./sphereCloudEffect";

type HandPoint = Vec3 & { hue: number; normal?: Vec3 };

type FingerConfig = {
  base: Vec3;
  dir: Vec3;
  length: number;
  baseRadius: number;
  tipRadius: number;
};

type PalmSlabConfig = {
  rx: number;
  rz: number;
  thickness: number;
  n: number;
  radialSteps: number;
  angularSteps: number;
  wristTaper: number;
  thenarBump: number;
};

const LIGHT_DIRECTION = normalize({ x: -0.3, y: -0.2, z: -1 });

function colorFromHue(hue: number, lightness: number, alpha = 1): string {
  return `hsla(${hue}, 80%, ${lightness}%, ${alpha})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clampHueFromY(y: number): number {
  const t = clamp((y + 1.2) / 2.4, 0, 1);
  return 180 + t * 160;
}

function superellipseRadius(x: number, z: number, rx: number, rz: number, n: number): number {
  const ax = Math.abs(x) / rx;
  const az = Math.abs(z) / rz;
  return Math.pow(Math.pow(ax, n) + Math.pow(az, n), 1 / n);
}

function palmHeightField(x: number, z: number, config: PalmSlabConfig): number {
  const radius = superellipseRadius(x, z, config.rx, config.rz, config.n);
  const inside = clamp(1 - radius, 0, 1);
  const dome = inside * inside;
  const wrist = clamp(-z / config.rz + 0.15, 0, 1);
  const wristCut = wrist * config.wristTaper;

  const tx = (x + config.rx * 0.55) / (config.rx * 0.55);
  const tz = (z - config.rz * 0.15) / (config.rz * 0.55);
  const thenar = Math.exp(-(tx * tx + tz * tz) * 2.2) * config.thenarBump;

  return (
    config.thickness * (0.55 + 0.45 * dome) -
    config.thickness * 0.55 * wristCut +
    config.thickness * 0.5 * thenar
  );
}

function buildPalmPointsSlab(config: PalmSlabConfig): HandPoint[] {
  const points: HandPoint[] = [];
  const radialSteps = Math.max(6, Math.floor(config.radialSteps));
  const angularSteps = Math.max(24, Math.floor(config.angularSteps));

  for (let radial = 0; radial <= radialSteps; radial += 1) {
    const t = radial / radialSteps;
    for (let angular = 0; angular < angularSteps; angular += 1) {
      const angle = (angular / angularSteps) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dz = Math.sin(angle);

      let s0 = 0;
      let s1 = 1;
      for (let i = 0; i < 10; i += 1) {
        const mid = (s0 + s1) / 2;
        const x = dx * config.rx * mid;
        const z = dz * config.rz * mid;
        const radius = superellipseRadius(x, z, config.rx, config.rz, config.n);
        if (radius <= 1) {
          s0 = mid;
        } else {
          s1 = mid;
        }
      }

      const s = s0 * t;
      const x = dx * config.rx * s;
      const z = dz * config.rz * s;
      const topY = palmHeightField(x, z, config);
      const bottomY = -config.thickness * 0.9;

      const eps = 0.02;
      const hx = palmHeightField(x + eps, z, config) - palmHeightField(x - eps, z, config);
      const hz = palmHeightField(x, z + eps, config) - palmHeightField(x, z - eps, config);
      const topNormal = normalize({ x: -hx, y: 2 * eps, z: -hz });

      points.push({
        x,
        y: topY,
        z,
        hue: clampHueFromY(topY),
        normal: topNormal
      });

      points.push({
        x,
        y: bottomY,
        z,
        hue: clampHueFromY(bottomY),
        normal: { x: 0, y: -1, z: 0 }
      });
    }
  }

  const rimVerticalSteps = 6;
  for (let angular = 0; angular < angularSteps; angular += 1) {
    const angle = (angular / angularSteps) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    let s0 = 0;
    let s1 = 1;
    for (let i = 0; i < 10; i += 1) {
      const mid = (s0 + s1) / 2;
      const x = dx * config.rx * mid;
      const z = dz * config.rz * mid;
      const radius = superellipseRadius(x, z, config.rx, config.rz, config.n);
      if (radius <= 1) {
        s0 = mid;
      } else {
        s1 = mid;
      }
    }

    const x = dx * config.rx * s0;
    const z = dz * config.rz * s0;
    const topY = palmHeightField(x, z, config);
    const bottomY = -config.thickness * 0.9;
    const sideNormal = normalize({ x: dx / config.rx, y: 0, z: dz / config.rz });

    for (let vertical = 0; vertical <= rimVerticalSteps; vertical += 1) {
      const vt = vertical / rimVerticalSteps;
      const y = lerp(bottomY, topY, vt);
      points.push({
        x,
        y,
        z,
        hue: clampHueFromY(y),
        normal: sideNormal
      });
    }
  }

  return points;
}

function buildPerpendicularBasis(direction: Vec3): { u: Vec3; v: Vec3 } {
  const dir = normalize(direction);
  const helper = Math.abs(dir.y) < 0.85 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u = normalize(cross(dir, helper));
  const v = normalize(cross(dir, u));
  return { u, v };
}

function buildFingerPoints(fingers: FingerConfig[], ringSegments = 20, lengthSegments = 14): HandPoint[] {
  const points: HandPoint[] = [];

  fingers.forEach((finger) => {
    const dir = normalize(finger.dir);
    const basis = buildPerpendicularBasis(dir);
    const tipCenter = {
      x: finger.base.x + dir.x * finger.length,
      y: finger.base.y + dir.y * finger.length,
      z: finger.base.z + dir.z * finger.length
    };

    for (let i = 0; i <= lengthSegments; i += 1) {
      const t = i / lengthSegments;
      const center = {
        x: finger.base.x + dir.x * finger.length * t,
        y: finger.base.y + dir.y * finger.length * t,
        z: finger.base.z + dir.z * finger.length * t
      };
      const radius = lerp(finger.baseRadius, finger.tipRadius, t);
      for (let r = 0; r < ringSegments; r += 1) {
        const angle = (r / ringSegments) * Math.PI * 2;
        const offset = {
          x: basis.u.x * Math.cos(angle) * radius + basis.v.x * Math.sin(angle) * radius,
          y: basis.u.y * Math.cos(angle) * radius + basis.v.y * Math.sin(angle) * radius,
          z: basis.u.z * Math.cos(angle) * radius + basis.v.z * Math.sin(angle) * radius
        };
        const point = {
          x: center.x + offset.x,
          y: center.y + offset.y,
          z: center.z + offset.z
        };
        points.push({
          ...point,
          hue: clampHueFromY(point.y),
          normal: normalize({ x: point.x - center.x, y: point.y - center.y, z: point.z - center.z })
        });
      }
    }

    const capSteps = 4;
    for (let cap = 1; cap <= capSteps; cap += 1) {
      const capT = cap / capSteps;
      const capAngle = (capT * Math.PI) / 2;
      const capRadius = Math.sin(capAngle) * finger.tipRadius * 0.9;
      const capOffset = Math.cos(capAngle) * finger.tipRadius * 0.9;
      const capCenter = {
        x: tipCenter.x + dir.x * capOffset,
        y: tipCenter.y + dir.y * capOffset,
        z: tipCenter.z + dir.z * capOffset
      };
      for (let r = 0; r < ringSegments; r += 1) {
        const angle = (r / ringSegments) * Math.PI * 2;
        const offset = {
          x: basis.u.x * Math.cos(angle) * capRadius + basis.v.x * Math.sin(angle) * capRadius,
          y: basis.u.y * Math.cos(angle) * capRadius + basis.v.y * Math.sin(angle) * capRadius,
          z: basis.u.z * Math.cos(angle) * capRadius + basis.v.z * Math.sin(angle) * capRadius
        };
        const point = {
          x: capCenter.x + offset.x,
          y: capCenter.y + offset.y,
          z: capCenter.z + offset.z
        };
        points.push({
          ...point,
          hue: clampHueFromY(point.y),
          normal: normalize({ x: point.x - capCenter.x, y: point.y - capCenter.y, z: point.z - capCenter.z })
        });
      }
    }
  });

  return points;
}

export function buildHandCloudPoints(): HandPoint[] {
  const palm = buildPalmPointsSlab({
    rx: 1.15,
    rz: 0.95,
    thickness: 0.42,
    n: 4.8,
    radialSteps: 14,
    angularSteps: 34,
    wristTaper: 0.9,
    thenarBump: 0.9
  });

  const fingers = buildFingerPoints([
    {
      base: { x: -0.95, y: 0.35, z: 0.15 },
      dir: { x: -0.55, y: 0.82, z: 0.05 },
      length: 1.05,
      baseRadius: 0.28,
      tipRadius: 0.16
    },
    {
      base: { x: -0.45, y: 0.55, z: 0.2 },
      dir: { x: -0.1, y: 0.98, z: 0.05 },
      length: 1.6,
      baseRadius: 0.2,
      tipRadius: 0.1
    },
    {
      base: { x: -0.1, y: 0.6, z: 0.2 },
      dir: { x: -0.02, y: 0.99, z: 0.02 },
      length: 1.75,
      baseRadius: 0.2,
      tipRadius: 0.1
    },
    {
      base: { x: 0.25, y: 0.55, z: 0.18 },
      dir: { x: 0.12, y: 0.98, z: -0.04 },
      length: 1.65,
      baseRadius: 0.19,
      tipRadius: 0.09
    },
    {
      base: { x: 0.55, y: 0.48, z: 0.12 },
      dir: { x: 0.25, y: 0.96, z: -0.08 },
      length: 1.45,
      baseRadius: 0.18,
      tipRadius: 0.08
    }
  ]);

  return [...palm, ...fingers];
}

export class HandCloudEffect implements Effect {
  private points: HandPoint[] = [];

  constructor() {
    this.points = buildHandCloudPoints();
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const speed = params.speed ?? 1.0;
    const spread = clamp(params.spread ?? 1.0, 0.6, 1.6);
    const baseScale = (params.scale ?? 1.0) * 1.4;
    const energy = clamp(audio.bass * 1.1 + audio.treble * 0.5 + audio.rms * 0.3, 0, 1);
    const fov = Math.min(width, height) * 0.9;
    const cameraDistance = 6.2;
    const rotation = {
      x: time * 0.45 * speed + energy * 0.7,
      y: time * 0.6 * speed + energy * 0.45,
      z: time * 0.18 * speed + energy * 0.15
    };
    const scale = baseScale + energy * 0.22;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(4, 8, 16)";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "lighter";

    this.points.forEach((point) => {
      const scaledPoint = {
        x: point.x * scale * spread,
        y: point.y * scale,
        z: point.z * scale * (1 + (spread - 1) * 0.25)
      };
      const rotated = applyRotation(scaledPoint, rotation);
      const normal = point.normal ? normalize(applyRotation(point.normal, rotation)) : normalize(rotated);
      const light = clamp(dot(normal, LIGHT_DIRECTION), 0.05, 1);
      const projected = projectPoint(rotated, cameraDistance, fov, width, height);
      if (projected.depth <= 0) {
        return;
      }
      const size = clamp(projected.scale * 0.85, 0.35, 2.6);
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
