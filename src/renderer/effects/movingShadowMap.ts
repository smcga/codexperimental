import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type MovingShadowPaletteMode = "dusk" | "mono" | "neon";
type SceneEra = "8bit" | "16bit" | "ps1" | "pcdemo" | "future";

type MovingShadowMapParams = {
  seed: number;
  objectCount: number;
  lightCount: number;
  lightSpeed: number;
  lightHeightMin: number;
  lightHeightMax: number;
  shadowLength: number;
  shadowSoftness: number;
  floorGrid: number;
  paletteMode: MovingShadowPaletteMode;
  contrast: number;
  haze: number;
  orbitRadius: number;
  colorA: string;
  colorB: string;
  lightColor: string;
};

type LightState = {
  x: number;
  y: number;
  z: number;
  intensity: number;
};

type SceneObject = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  style: "box" | "slab" | "pillar";
  tone: number;
};

type Vec2 = { x: number; y: number };

type CameraProjectConfig = {
  width: number;
  height: number;
  horizon: number;
  cameraHeight: number;
  cameraZ: number;
  focal: number;
  scale: number;
};

type Palette = {
  bgTop: string;
  bgBottom: string;
  floorNear: string;
  floorFar: string;
  objectBase: [number, number, number];
  light: string;
};

const TAU = Math.PI * 2;
const MIN_FLOOR_Z = 1.5;
const MAX_FLOOR_Z = 18;

export const MOVING_SHADOW_MAP_DEFAULTS = {
  seed: 7,
  objectCount: 6,
  lightCount: 1,
  lightSpeed: 0.75,
  lightHeightMin: 1.6,
  lightHeightMax: 4.4,
  shadowLength: 1.35,
  shadowSoftness: 0.45,
  floorGrid: 1,
  paletteMode: "dusk",
  contrast: 1,
  haze: 0.24,
  orbitRadius: 4.2,
  colorA: "#1f2e5a",
  colorB: "#ff9472",
  lightColor: "#ffe9be"
} as const;

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toFiniteString = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

const resolvePaletteMode = (value: unknown): MovingShadowPaletteMode => {
  if (value === "mono" || value === "neon" || value === "dusk") {
    return value;
  }
  return MOVING_SHADOW_MAP_DEFAULTS.paletteMode;
};

export const resolveMovingShadowMapParams = (params: Record<string, unknown>): MovingShadowMapParams => ({
  seed: Math.round(toFiniteNumber(params.seed, MOVING_SHADOW_MAP_DEFAULTS.seed)),
  objectCount: Math.round(clamp(toFiniteNumber(params.objectCount, MOVING_SHADOW_MAP_DEFAULTS.objectCount), 4, 8)),
  lightCount: Math.round(clamp(toFiniteNumber(params.lightCount, MOVING_SHADOW_MAP_DEFAULTS.lightCount), 1, 2)),
  lightSpeed: clamp(toFiniteNumber(params.lightSpeed, MOVING_SHADOW_MAP_DEFAULTS.lightSpeed), 0.1, 3),
  lightHeightMin: clamp(toFiniteNumber(params.lightHeightMin, MOVING_SHADOW_MAP_DEFAULTS.lightHeightMin), 0.8, 7),
  lightHeightMax: clamp(toFiniteNumber(params.lightHeightMax, MOVING_SHADOW_MAP_DEFAULTS.lightHeightMax), 1.2, 9),
  shadowLength: clamp(toFiniteNumber(params.shadowLength, MOVING_SHADOW_MAP_DEFAULTS.shadowLength), 0.4, 3),
  shadowSoftness: clamp(toFiniteNumber(params.shadowSoftness, MOVING_SHADOW_MAP_DEFAULTS.shadowSoftness), 0, 1),
  floorGrid: clamp(toFiniteNumber(params.floorGrid, MOVING_SHADOW_MAP_DEFAULTS.floorGrid), 0, 1),
  paletteMode: resolvePaletteMode(params.paletteMode),
  contrast: clamp(toFiniteNumber(params.contrast, MOVING_SHADOW_MAP_DEFAULTS.contrast), 0.6, 1.8),
  haze: clamp(toFiniteNumber(params.haze, MOVING_SHADOW_MAP_DEFAULTS.haze), 0, 1),
  orbitRadius: clamp(toFiniteNumber(params.orbitRadius, MOVING_SHADOW_MAP_DEFAULTS.orbitRadius), 1.8, 8),
  colorA: toFiniteString(params.colorA, MOVING_SHADOW_MAP_DEFAULTS.colorA),
  colorB: toFiniteString(params.colorB, MOVING_SHADOW_MAP_DEFAULTS.colorB),
  lightColor: toFiniteString(params.lightColor, MOVING_SHADOW_MAP_DEFAULTS.lightColor)
});

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967295;
  };
};

const resolveEra = (era?: string): SceneEra => {
  if (era === "8bit" || era === "16bit" || era === "ps1" || era === "pcdemo" || era === "future") {
    return era;
  }
  return "pcdemo";
};

const pickPalette = (mode: MovingShadowPaletteMode, params: MovingShadowMapParams): Palette => {
  if (mode === "mono") {
    return {
      bgTop: "#0a0a0d",
      bgBottom: "#2a2a30",
      floorNear: "#626269",
      floorFar: "#3d3d43",
      objectBase: [220, 220, 228],
      light: "#ffffff"
    };
  }
  if (mode === "neon") {
    return {
      bgTop: "#070e2f",
      bgBottom: "#250038",
      floorNear: "#341257",
      floorFar: "#120c37",
      objectBase: [99, 212, 244],
      light: "#f4f1ff"
    };
  }
  return {
    bgTop: params.colorA,
    bgBottom: "#150f2c",
    floorNear: params.colorB,
    floorFar: "#2a1948",
    objectBase: [191, 211, 234],
    light: params.lightColor
  };
};

export const lightHeightToShadowScale = (lightY: number, minHeight: number, maxHeight: number, shadowLength: number): number => {
  const low = Math.min(minHeight, maxHeight);
  const high = Math.max(minHeight, maxHeight);
  const normalized = clamp((lightY - low) / Math.max(0.001, high - low), 0, 1);
  const lengthFactor = 1.8 - normalized * 1.25;
  return Math.max(0.15, shadowLength * lengthFactor);
};

export const worldToScreen = (x: number, y: number, z: number, config: CameraProjectConfig): Vec2 => {
  const depth = Math.max(0.2, z - config.cameraZ + config.focal);
  const invDepth = config.scale / depth;
  return {
    x: config.width * 0.5 + x * invDepth,
    y: config.horizon + (config.cameraHeight - y) * invDepth
  };
};

export const buildShadowPolygon = (
  object: SceneObject,
  light: LightState,
  params: MovingShadowMapParams
): [Vec2, Vec2, Vec2, Vec2] => {
  const halfW = object.width * 0.5;
  const halfD = object.depth * 0.5;
  const p0 = { x: object.x - halfW, z: object.z - halfD };
  const p1 = { x: object.x + halfW, z: object.z - halfD };
  const p2 = { x: object.x + halfW, z: object.z + halfD };
  const p3 = { x: object.x - halfW, z: object.z + halfD };
  const dirX = object.x - light.x;
  const dirZ = object.z - light.z;
  const dirLen = Math.hypot(dirX, dirZ) || 1;
  const stretch = lightHeightToShadowScale(light.y, params.lightHeightMin, params.lightHeightMax, params.shadowLength) * object.height;
  const sx = (dirX / dirLen) * stretch;
  const sz = (dirZ / dirLen) * stretch;

  return [
    { x: p0.x, y: p0.z },
    { x: p1.x, y: p1.z },
    { x: p2.x + sx, y: p2.z + sz },
    { x: p3.x + sx, y: p3.z + sz }
  ];
};

const applyEraAdjustments = (params: MovingShadowMapParams, era: SceneEra): MovingShadowMapParams => {
  if (era === "8bit") {
    return { ...params, objectCount: Math.min(5, params.objectCount), shadowSoftness: Math.min(0.15, params.shadowSoftness), contrast: params.contrast * 1.1 };
  }
  if (era === "16bit") {
    return { ...params, objectCount: Math.min(6, params.objectCount), shadowSoftness: Math.min(0.28, params.shadowSoftness) };
  }
  if (era === "future") {
    return { ...params, haze: clamp(params.haze + 0.08, 0, 1), contrast: params.contrast * 1.08 };
  }
  return params;
};

const ensureCanvasBlur = (ctx: CanvasRenderingContext2D, blur: number): void => {
  (ctx as CanvasRenderingContext2D & { filter?: string }).filter = blur > 0 ? `blur(${blur.toFixed(2)}px)` : "none";
};

export class MovingShadowMapEffect implements Effect {
  private sceneObjects: SceneObject[] = [];
  private seededFor = Number.NaN;
  private seededCount = -1;

  render({ ctx, width, height, time, audio, params, era }: EffectRenderContext): void {
    const baseParams = resolveMovingShadowMapParams(params as Record<string, unknown>);
    const sceneEra = resolveEra(era);
    const config = applyEraAdjustments(baseParams, sceneEra);

    this.ensureScene(config.seed, config.objectCount);

    const pulse = audio.beat ? 0.18 + audio.beatStrength * 0.4 : 0;
    const bassPulse = 1 + audio.bass * 0.22;
    const orbitRadius = config.orbitRadius * bassPulse;

    const cameraConfig: CameraProjectConfig = {
      width,
      height,
      horizon: height * 0.22,
      cameraHeight: 4.9,
      cameraZ: -5.5,
      focal: 5.2,
      scale: Math.min(width, height) * 2.3
    };

    const palette = pickPalette(config.paletteMode, config);
    const backdrop = ctx.createLinearGradient(0, 0, 0, height);
    backdrop.addColorStop(0, palette.bgTop);
    backdrop.addColorStop(1, palette.bgBottom);
    ctx.fillStyle = backdrop;
    ctx.fillRect(0, 0, width, height);

    this.drawFloor(ctx, cameraConfig, config, palette);

    const lights = this.computeLights(time, audio, config, orbitRadius, pulse);

    for (let i = 0; i < this.sceneObjects.length; i += 1) {
      const object = this.sceneObjects[i];
      this.drawObjectShadow(ctx, object, lights, cameraConfig, config, sceneEra);
    }

    const sortedObjects = [...this.sceneObjects].sort((a, b) => a.z - b.z);
    for (let i = 0; i < sortedObjects.length; i += 1) {
      this.drawObject(ctx, sortedObjects[i], lights, cameraConfig, palette, config, sceneEra);
    }

    this.drawLightMarkers(ctx, lights, cameraConfig, config, palette, audio, sceneEra);
    this.drawHaze(ctx, width, height, config, sceneEra);
  }

  reset(): void {
    this.seededFor = Number.NaN;
    this.seededCount = -1;
    this.sceneObjects = [];
  }

  private ensureScene(seed: number, objectCount: number): void {
    if (seed === this.seededFor && objectCount === this.seededCount) {
      return;
    }
    const random = mulberry32(seed);
    const objects: SceneObject[] = new Array(objectCount);
    for (let i = 0; i < objectCount; i += 1) {
      const lane = i / Math.max(1, objectCount - 1);
      const x = (lane - 0.5) * 6.2 + (random() - 0.5) * 0.85;
      const z = 3.1 + i * 1.82 + random() * 0.8;
      const style = i % 3 === 0 ? "pillar" : i % 2 === 0 ? "box" : "slab";
      const width = style === "pillar" ? 0.65 + random() * 0.25 : 0.9 + random() * 0.5;
      const depth = style === "slab" ? 1.35 + random() * 0.5 : 0.85 + random() * 0.45;
      const height = style === "slab" ? 0.95 + random() * 0.45 : 1.4 + random() * 1.7;
      objects[i] = {
        x,
        z,
        width,
        depth,
        height,
        style,
        tone: 0.8 + random() * 0.45
      };
    }

    this.sceneObjects = objects;
    this.seededFor = seed;
    this.seededCount = objectCount;
  }

  private computeLights(
    time: number,
    audio: EffectRenderContext["audio"],
    params: MovingShadowMapParams,
    orbitRadius: number,
    pulse: number
  ): LightState[] {
    const lights: LightState[] = new Array(params.lightCount);
    const low = Math.min(params.lightHeightMin, params.lightHeightMax);
    const high = Math.max(params.lightHeightMin, params.lightHeightMax);
    for (let i = 0; i < params.lightCount; i += 1) {
      const phase = time * params.lightSpeed * (i === 0 ? 1 : -1.18) + i * 1.7 + pulse * 0.8;
      const radius = orbitRadius * (i === 0 ? 1 : 0.72);
      const x = Math.cos(phase) * radius;
      const z = 6.2 + Math.sin(phase * (i === 0 ? 0.9 : 1.1)) * (radius * 0.85);
      const hN = (Math.sin(phase * 1.3 + audio.bass * 1.2) + 1) * 0.5;
      const y = low + (high - low) * hN;
      const intensity = clamp(0.66 + pulse + audio.treble * 0.2 - i * 0.1, 0.4, 1.35);
      lights[i] = { x, y, z, intensity };
    }
    return lights;
  }

  private drawFloor(
    ctx: CanvasRenderingContext2D,
    camera: CameraProjectConfig,
    params: MovingShadowMapParams,
    palette: Palette
  ): void {
    const floorTopLeft = worldToScreen(-9, 0, MIN_FLOOR_Z, camera);
    const floorTopRight = worldToScreen(9, 0, MIN_FLOOR_Z, camera);
    const floorBottomRight = worldToScreen(12, 0, MAX_FLOOR_Z, camera);
    const floorBottomLeft = worldToScreen(-12, 0, MAX_FLOOR_Z, camera);

    const floorGradient = ctx.createLinearGradient(0, floorTopLeft.y, 0, floorBottomLeft.y);
    floorGradient.addColorStop(0, palette.floorNear);
    floorGradient.addColorStop(1, palette.floorFar);

    ctx.beginPath();
    ctx.moveTo(floorTopLeft.x, floorTopLeft.y);
    ctx.lineTo(floorTopRight.x, floorTopRight.y);
    ctx.lineTo(floorBottomRight.x, floorBottomRight.y);
    ctx.lineTo(floorBottomLeft.x, floorBottomLeft.y);
    ctx.closePath();
    ctx.fillStyle = floorGradient;
    ctx.fill();

    if (params.floorGrid < 0.5) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${(0.08 * params.contrast).toFixed(3)})`;
    ctx.lineWidth = 1;

    for (let x = -8; x <= 8; x += 1) {
      const a = worldToScreen(x, 0, MIN_FLOOR_Z, camera);
      const b = worldToScreen(x, 0, MAX_FLOOR_Z, camera);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (let z = Math.ceil(MIN_FLOOR_Z); z <= MAX_FLOOR_Z; z += 1) {
      const a = worldToScreen(-8, 0, z, camera);
      const b = worldToScreen(8, 0, z, camera);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawObjectShadow(
    ctx: CanvasRenderingContext2D,
    object: SceneObject,
    lights: LightState[],
    camera: CameraProjectConfig,
    params: MovingShadowMapParams,
    era: SceneEra
  ): void {
    for (let i = 0; i < lights.length; i += 1) {
      const light = lights[i];
      const shadowPolygon = buildShadowPolygon(object, light, params);
      const p0 = worldToScreen(shadowPolygon[0].x, 0, shadowPolygon[0].y, camera);
      const p1 = worldToScreen(shadowPolygon[1].x, 0, shadowPolygon[1].y, camera);
      const p2 = worldToScreen(shadowPolygon[2].x, 0, shadowPolygon[2].y, camera);
      const p3 = worldToScreen(shadowPolygon[3].x, 0, shadowPolygon[3].y, camera);
      const alpha = clamp((0.2 + object.height * 0.07) * light.intensity, 0.08, 0.42);

      ctx.save();
      if (era === "8bit" || era === "16bit") {
        ensureCanvasBlur(ctx, 0);
      } else {
        ensureCanvasBlur(ctx, params.shadowSoftness * 4.5);
      }
      ctx.fillStyle = `rgba(5, 8, 20, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  private drawObject(
    ctx: CanvasRenderingContext2D,
    object: SceneObject,
    lights: LightState[],
    camera: CameraProjectConfig,
    palette: Palette,
    params: MovingShadowMapParams,
    era: SceneEra
  ): void {
    const halfW = object.width * 0.5;
    const halfD = object.depth * 0.5;
    const baseA = worldToScreen(object.x - halfW, 0, object.z - halfD, camera);
    const baseB = worldToScreen(object.x + halfW, 0, object.z - halfD, camera);
    const baseC = worldToScreen(object.x + halfW, 0, object.z + halfD, camera);
    const baseD = worldToScreen(object.x - halfW, 0, object.z + halfD, camera);

    const topA = worldToScreen(object.x - halfW, object.height, object.z - halfD, camera);
    const topB = worldToScreen(object.x + halfW, object.height, object.z - halfD, camera);
    const topC = worldToScreen(object.x + halfW, object.height, object.z + halfD, camera);
    const topD = worldToScreen(object.x - halfW, object.height, object.z + halfD, camera);

    const brightness = this.lightContribution(object, lights, params.contrast);
    const quantize = era === "8bit";
    const bodyColor = palette.objectBase.map((channel) => clamp(channel * object.tone * brightness, 10, 255));

    const sideColor = `rgb(${bodyColor.map((channel) => Math.round(channel * 0.58)).join(",")})`;
    const frontColor = `rgb(${bodyColor.map((channel) => Math.round(channel * 0.72)).join(",")})`;
    const topColor = `rgb(${bodyColor.map((channel) => Math.round(channel)).join(",")})`;

    const moveTo = (point: Vec2): void => {
      ctx.moveTo(quantize ? Math.round(point.x) : point.x, quantize ? Math.round(point.y) : point.y);
    };
    const lineTo = (point: Vec2): void => {
      ctx.lineTo(quantize ? Math.round(point.x) : point.x, quantize ? Math.round(point.y) : point.y);
    };

    ctx.fillStyle = sideColor;
    ctx.beginPath();
    moveTo(baseB);
    lineTo(baseC);
    lineTo(topC);
    lineTo(topB);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = frontColor;
    ctx.beginPath();
    moveTo(baseD);
    lineTo(baseC);
    lineTo(topC);
    lineTo(topD);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = topColor;
    ctx.beginPath();
    moveTo(topA);
    lineTo(topB);
    lineTo(topC);
    lineTo(topD);
    ctx.closePath();
    ctx.fill();

    if (era === "future") {
      ctx.save();
      ensureCanvasBlur(ctx, 1.4 + params.shadowSoftness * 2.2);
      ctx.strokeStyle = `rgba(214, 244, 255, ${(0.2 + (brightness - 0.6) * 0.24).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      moveTo(topA);
      lineTo(topB);
      lineTo(topC);
      lineTo(topD);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  private lightContribution(object: SceneObject, lights: LightState[], contrast: number): number {
    let total = 0.44;
    for (let i = 0; i < lights.length; i += 1) {
      const light = lights[i];
      const dx = light.x - object.x;
      const dz = light.z - object.z;
      const dy = light.y - object.height * 0.8;
      const dist = Math.sqrt(dx * dx + dz * dz + dy * dy);
      total += clamp((light.intensity * contrast) / (1 + dist * 0.55), 0, 0.95);
    }
    return clamp(total, 0.3, 1.45);
  }

  private drawLightMarkers(
    ctx: CanvasRenderingContext2D,
    lights: LightState[],
    camera: CameraProjectConfig,
    params: MovingShadowMapParams,
    palette: Palette,
    audio: EffectRenderContext["audio"],
    era: SceneEra
  ): void {
    const shimmer = 1 + audio.treble * 0.35;
    for (let i = 0; i < lights.length; i += 1) {
      const light = lights[i];
      const anchor = worldToScreen(light.x, 0.05, light.z, camera);
      const pos = worldToScreen(light.x, light.y, light.z, camera);
      const glowRadius = (6 + light.y * 1.8) * shimmer;

      ctx.save();
      ensureCanvasBlur(ctx, era === "8bit" ? 0 : 3);
      ctx.strokeStyle = `rgba(255, 245, 210, ${(0.2 + light.intensity * 0.1).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius);
      gradient.addColorStop(0, palette.light);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowRadius, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawHaze(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    params: MovingShadowMapParams,
    era: SceneEra
  ): void {
    const hazeStrength = clamp(params.haze * (era === "future" ? 1.35 : 1), 0, 1);
    if (hazeStrength <= 0.001) {
      return;
    }

    const haze = ctx.createLinearGradient(0, 0, 0, height);
    haze.addColorStop(0, `rgba(255, 255, 255, ${(hazeStrength * 0.04).toFixed(3)})`);
    haze.addColorStop(0.6, "rgba(180, 205, 255, 0)");
    haze.addColorStop(1, `rgba(6, 8, 18, ${(hazeStrength * 0.3).toFixed(3)})`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
  }
}
