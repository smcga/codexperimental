import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type ShadowVolumesParams = {
  count: number;
  seed: number;
  speed: number;
  contrast: number;
  lightYawAmp: number;
  lightHeight: number;
  shadowLength: number;
  perspective: number;
  groundGrid: number;
  rotateOccluders: boolean;
  accent: number;
  beatPunch: number;
  cameraDrift: number;
  mobilePadding: number;
};

type Vec2 = { x: number; y: number };
type Vec3 = { x: number; y: number; z: number };

type Occluder = {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  yaw: number;
  wobble: number;
};

export const SHADOW_VOLUMES_DEFAULTS = {
  count: 6,
  seed: 11,
  speed: 1,
  contrast: 0.86,
  lightYawAmp: 1,
  lightHeight: 1,
  shadowLength: 1,
  perspective: 1,
  groundGrid: 0.45,
  rotateOccluders: 1,
  accent: 0.32,
  beatPunch: 0.5,
  cameraDrift: 0.3,
  mobilePadding: 0.05
} as const;

const TAU = Math.PI * 2;
const hashFloat = (value: number): number => {
  const v = Math.sin(value * 127.1 + 311.7) * 43758.5453123;
  return v - Math.floor(v);
};

const resolveNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveShadowVolumesParams = (params: Record<string, unknown>, era?: string): ShadowVolumesParams => {
  const base: ShadowVolumesParams = {
    count: Math.floor(clamp(resolveNumber(params.count, SHADOW_VOLUMES_DEFAULTS.count), 2, 14)),
    seed: Math.round(resolveNumber(params.seed, SHADOW_VOLUMES_DEFAULTS.seed)),
    speed: clamp(resolveNumber(params.speed, SHADOW_VOLUMES_DEFAULTS.speed), 0.15, 3),
    contrast: clamp(resolveNumber(params.contrast, SHADOW_VOLUMES_DEFAULTS.contrast), 0.2, 1.5),
    lightYawAmp: clamp(resolveNumber(params.lightYawAmp, SHADOW_VOLUMES_DEFAULTS.lightYawAmp), 0.1, 2.5),
    lightHeight: clamp(resolveNumber(params.lightHeight, SHADOW_VOLUMES_DEFAULTS.lightHeight), 0.2, 2),
    shadowLength: clamp(resolveNumber(params.shadowLength, SHADOW_VOLUMES_DEFAULTS.shadowLength), 0.4, 3),
    perspective: clamp(resolveNumber(params.perspective, SHADOW_VOLUMES_DEFAULTS.perspective), 0.45, 1.8),
    groundGrid: clamp(resolveNumber(params.groundGrid, SHADOW_VOLUMES_DEFAULTS.groundGrid), 0, 1),
    rotateOccluders: resolveNumber(params.rotateOccluders, SHADOW_VOLUMES_DEFAULTS.rotateOccluders) >= 0.5,
    accent: clamp(resolveNumber(params.accent, SHADOW_VOLUMES_DEFAULTS.accent), 0, 1),
    beatPunch: clamp(resolveNumber(params.beatPunch, SHADOW_VOLUMES_DEFAULTS.beatPunch), 0, 1),
    cameraDrift: clamp(resolveNumber(params.cameraDrift, SHADOW_VOLUMES_DEFAULTS.cameraDrift), 0, 1),
    mobilePadding: clamp(resolveNumber(params.mobilePadding, SHADOW_VOLUMES_DEFAULTS.mobilePadding), 0, 0.24)
  };

  if (era === "8bit" || era === "16bit") {
    base.count = Math.min(base.count, 8);
    base.groundGrid = Math.max(base.groundGrid, 0.45);
    base.accent *= 0.45;
  } else if (era === "ps1") {
    base.perspective = clamp(base.perspective * 1.1, 0.45, 1.8);
  } else if (era === "future") {
    base.count = Math.min(14, base.count + 1);
    base.contrast = clamp(base.contrast * 1.14, 0.2, 1.5);
    base.lightYawAmp = clamp(base.lightYawAmp * 1.2, 0.1, 2.5);
  }

  return base;
};

export const buildShadowVolumeOccluders = (count: number, seed: number): Occluder[] =>
  Array.from({ length: count }, (_, index) => {
    const t = seed * 13.17 + index * 19.31;
    const lane = (index / Math.max(1, count - 1) - 0.5) * 2;
    const x = lane * 2.8 + (hashFloat(t + 0.9) - 0.5) * 1.2;
    const y = lerp(1.8, 8.6, hashFloat(t + 1.7));
    return {
      x,
      y,
      width: lerp(0.5, 1.3, hashFloat(t + 2.3)),
      depth: lerp(0.5, 1.15, hashFloat(t + 3.4)),
      height: lerp(1.2, 3.8, hashFloat(t + 4.1)),
      yaw: hashFloat(t + 6.4) * TAU,
      wobble: hashFloat(t + 9.7) * TAU
    };
  });

const rotate2D = (x: number, y: number, angle: number): Vec2 => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: x * c - y * s, y: x * s + y * c };
};

const getOccluderBaseCorners = (occluder: Occluder, angle: number): Vec3[] => {
  const hx = occluder.width * 0.5;
  const hy = occluder.depth * 0.5;
  const local = [
    { x: -hx, y: -hy },
    { x: hx, y: -hy },
    { x: hx, y: hy },
    { x: -hx, y: hy }
  ];
  return local.map((point) => {
    const rotated = rotate2D(point.x, point.y, angle);
    return { x: occluder.x + rotated.x, y: occluder.y + rotated.y, z: 0 };
  });
};

export const projectShadowVolumesPoint = (
  point: Vec3,
  camera: { x: number; y: number; horizonY: number; scale: number; perspective: number }
): Vec2 => {
  const depth = Math.max(0.25, point.y + camera.y);
  const persp = camera.scale / (1 + depth * 0.18 * camera.perspective);
  return {
    x: camera.x + point.x * persp,
    y: camera.horizonY + depth * persp * 0.92 - point.z * persp
  };
};

const rayGroundIntersection = (light: Vec3, top: Vec3): Vec3 => {
  const dz = top.z - light.z;
  const t = dz === 0 ? 1 : clamp(-light.z / dz, 0.02, 12);
  return {
    x: light.x + (top.x - light.x) * t,
    y: light.y + (top.y - light.y) * t,
    z: 0
  };
};

export const buildOccluderShadowPolygon = (occluder: Occluder, light: Vec3, stretch: number): Vec3[] => {
  const corners = getOccluderBaseCorners(occluder, occluder.yaw);
  const top = corners.map((corner) => ({ ...corner, z: occluder.height }));
  const projected = top.map((corner) => {
    const hit = rayGroundIntersection(light, corner);
    return {
      x: corner.x + (hit.x - corner.x) * stretch,
      y: corner.y + (hit.y - corner.y) * stretch,
      z: 0
    };
  });

  return [corners[0], corners[1], corners[2], corners[3], projected[3], projected[2], projected[1], projected[0]];
};

const drawPolygon = (ctx: CanvasRenderingContext2D, points: Vec2[]): void => {
  if (points.length < 3) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
};

export class ShadowVolumesEffect implements Effect {
  private cachedSeed = Number.NaN;
  private cachedCount = -1;
  private occluders: Occluder[] = [];

  render({ ctx, width, height, time, audio, params, era, framing, safeRect }: EffectRenderContext): void {
    const settings = resolveShadowVolumesParams(params as Record<string, unknown>, era);
    if (this.cachedSeed !== settings.seed || this.cachedCount !== settings.count) {
      this.occluders = buildShadowVolumeOccluders(settings.count, settings.seed);
      this.cachedSeed = settings.seed;
      this.cachedCount = settings.count;
    }

    const isMobileFit = framing?.mode === "mobileFit";
    const activeSafe = safeRect ?? { x: 0, y: 0, w: width, h: height };
    const framePad = isMobileFit ? settings.mobilePadding : settings.mobilePadding * 0.5;
    const margin = Math.min(activeSafe.w, activeSafe.h) * framePad;
    const view = {
      x: activeSafe.x + margin,
      y: activeSafe.y + margin,
      w: Math.max(10, activeSafe.w - margin * 2),
      h: Math.max(10, activeSafe.h - margin * 2)
    };

    const beatSnap = audio.beat ? 1 : 0;
    const bass = clamp(audio.bass, 0, 1);
    const mid = clamp(audio.mid, 0, 1);
    const treble = clamp(audio.treble, 0, 1);
    const beatStrength = clamp(audio.beatStrength, 0, 1);

    const phase = time * settings.speed;
    const beatPunch = 1 + (settings.beatPunch * 0.45 + beatStrength * 0.25) * beatSnap;
    const drift = settings.cameraDrift * (0.2 + bass * 0.9);
    const camera = {
      x: view.x + view.w * 0.5 + Math.sin(phase * 0.36) * view.w * 0.05 * drift,
      y: 0,
      horizonY: view.y + view.h * (0.24 + Math.sin(phase * 0.21) * 0.015 * drift),
      scale: view.h * (0.34 + settings.perspective * 0.11),
      perspective: settings.perspective
    };

    const light = {
      x: Math.sin(phase * 0.72) * (3.3 + settings.lightYawAmp * 2.8) * (1 + bass * 0.4 * settings.beatPunch),
      y: -2.2 + Math.cos(phase * 0.49 + 0.8) * 2.1,
      z: (4 + settings.lightHeight * 3.5) * beatPunch
    };

    const bgTop = Math.round(8 + settings.contrast * 24);
    const bgBottom = Math.round(3 + settings.contrast * 7);
    const groundLight = Math.round(42 + settings.contrast * 78 + beatSnap * settings.beatPunch * 50);
    const horizonColor = `rgb(${bgTop}, ${bgTop + 2}, ${bgTop + 6})`;
    const floorColor = `rgb(${bgBottom}, ${bgBottom}, ${bgBottom + 1})`;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, horizonColor);
    gradient.addColorStop(0.62, floorColor);
    gradient.addColorStop(1, "rgb(1, 1, 2)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = `rgba(${groundLight}, ${groundLight}, ${Math.min(255, groundLight + 8)}, ${0.18 + settings.contrast * 0.17})`;
    ctx.fillRect(view.x, camera.horizonY, view.w, view.h + view.y - camera.horizonY);

    if (settings.groundGrid > 0.01) {
      const gridAlpha = 0.08 * settings.groundGrid * (1 + treble * 0.5);
      ctx.strokeStyle = `rgba(255, 255, 255, ${gridAlpha.toFixed(3)})`;
      for (let z = 1; z < 12; z += era === "8bit" || era === "16bit" ? 2 : 1) {
        const t = z / 12;
        const y = lerp(camera.horizonY + 6, view.y + view.h, t * t);
        ctx.beginPath();
        ctx.moveTo(view.x, y);
        ctx.lineTo(view.x + view.w, y);
        ctx.stroke();
      }
      for (let x = -4; x <= 4; x += 1) {
        const near = projectShadowVolumesPoint({ x: x * 1.6, y: 10, z: 0 }, camera);
        const far = projectShadowVolumesPoint({ x: x * 1.6, y: 0.5, z: 0 }, camera);
        ctx.beginPath();
        ctx.moveTo(near.x, near.y);
        ctx.lineTo(far.x, far.y);
        ctx.stroke();
      }
    }

    const occluders = this.occluders
      .map((occluder, index) => {
        const spin = settings.rotateOccluders ? Math.sin(phase * (0.3 + index * 0.05) + occluder.wobble + mid * 0.4) * 0.26 : 0;
        const yaw = occluder.yaw + spin;
        const pulse = 1 + Math.sin(phase * 0.8 + occluder.wobble) * 0.04 * mid;
        return {
          ...occluder,
          yaw,
          height: occluder.height * pulse
        };
      })
      .sort((a, b) => a.y - b.y);

    const stretch = settings.shadowLength * (1.3 + bass * 1.2 + beatSnap * settings.beatPunch * 1.4);
    const shadowAlpha = clamp(0.3 + settings.contrast * 0.45, 0.2, 0.9);

    occluders.forEach((occluder) => {
      const polygon = buildOccluderShadowPolygon(occluder, light, stretch).map((point) => projectShadowVolumesPoint(point, camera));
      drawPolygon(ctx, polygon);
      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`;
      ctx.fill();
    });

    occluders.forEach((occluder) => {
      const base = getOccluderBaseCorners(occluder, occluder.yaw);
      const top = base.map((point) => ({ ...point, z: occluder.height }));
      const pBase = base.map((point) => projectShadowVolumesPoint(point, camera));
      const pTop = top.map((point) => projectShadowVolumesPoint(point, camera));

      const lightDir = { x: light.x - occluder.x, y: light.y - occluder.y };
      const side = lightDir.x > 0 ? 1 : 3;
      const front = lightDir.y > 0 ? 0 : 2;
      const faceShade = 40 + settings.contrast * 80;
      const accentHue = 200 + settings.accent * 110;

      const sideFace = [pBase[side], pBase[(side + 1) % 4], pTop[(side + 1) % 4], pTop[side]];
      drawPolygon(ctx, sideFace);
      ctx.fillStyle = `rgba(${Math.round(faceShade * 0.6)}, ${Math.round(faceShade * 0.62)}, ${Math.round(faceShade * 0.68)}, 1)`;
      ctx.fill();

      const frontFace = [pBase[front], pBase[(front + 1) % 4], pTop[(front + 1) % 4], pTop[front]];
      drawPolygon(ctx, frontFace);
      ctx.fillStyle = `rgba(${Math.round(faceShade * 0.8)}, ${Math.round(faceShade * 0.84)}, ${Math.round(faceShade * 0.9)}, 1)`;
      ctx.fill();

      drawPolygon(ctx, pTop);
      ctx.fillStyle = `rgba(${Math.round(faceShade)}, ${Math.round(faceShade + 4)}, ${Math.round(faceShade + 10)}, 1)`;
      ctx.fill();

      if (settings.accent > 0.001) {
        ctx.strokeStyle = `hsla(${accentHue.toFixed(1)}, 85%, 72%, ${(0.14 + settings.accent * 0.45 + treble * 0.15).toFixed(3)})`;
        ctx.lineWidth = 1 + settings.accent * 1.4;
        ctx.beginPath();
        ctx.moveTo(pTop[0].x, pTop[0].y);
        ctx.lineTo(pTop[1].x, pTop[1].y);
        ctx.lineTo(pTop[2].x, pTop[2].y);
        ctx.stroke();
      }
    });

    const lightMarker = projectShadowVolumesPoint(light, camera);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 240, ${(0.3 + settings.accent * 0.4 + treble * 0.2).toFixed(3)})`;
    ctx.arc(lightMarker.x, lightMarker.y, 3 + bass * 2, 0, TAU);
    ctx.fill();

    if (era === "8bit") {
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#ffffff";
      for (let y = 0; y < height; y += 2) {
        ctx.fillRect(0, y, width, 1);
      }
      ctx.globalAlpha = 1;
    }

    if (era === "ps1") {
      const wobble = 0.65 + beatStrength * 0.75;
      ctx.drawImage(ctx.canvas, wobble, 0, width - wobble * 2, height, 0, 0, width, height);
    }

  }
}
