import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type GlenzModel = "cube" | "octa" | "icosa";
type GlenzSort = "none" | "backToFront";

type GlenzModelDefinition = {
  vertices: Float32Array;
  faces: Uint16Array;
  vertexCount: number;
  faceCount: number;
};

export const GLENZ_VECTORS_DEFAULTS = {
  model: "octa" as GlenzModel,
  instances: 2,
  camDist: 3.0,
  rotXSpeed: 0.6,
  rotYSpeed: 0.85,
  rotZSpeed: 0.25,
  baseHue: 200,
  hueSpeed: 35,
  sat: 85,
  lightness: 55,
  faceAlpha: 0.1,
  edge: true,
  edgeAlpha: 0.22,
  lineWidth: 2,
  trailFade: 0,
  sortFaces: "none" as GlenzSort,
  audioReact: 0.7,
  beatKick: 0.7,
  seed: 0
};

export type GlenzVectorsParams = {
  model: GlenzModel;
  instances: number;
  camDist: number;
  focal: number;
  rotXSpeed: number;
  rotYSpeed: number;
  rotZSpeed: number;
  baseHue: number;
  hueSpeed: number;
  sat: number;
  lightness: number;
  faceAlpha: number;
  edge: boolean;
  edgeAlpha: number;
  lineWidth: number;
  trailFade: number;
  sortFaces: GlenzSort;
  audioReact: number;
  beatKick: number;
  seed: number;
};

const CUBE_VERTICES = new Float32Array([
  -1, -1, -1,
  1, -1, -1,
  1, 1, -1,
  -1, 1, -1,
  -1, -1, 1,
  1, -1, 1,
  1, 1, 1,
  -1, 1, 1
]);

const CUBE_FACES = new Uint16Array([
  0, 1, 2,
  0, 2, 3,
  4, 5, 6,
  4, 6, 7,
  0, 1, 5,
  0, 5, 4,
  1, 2, 6,
  1, 6, 5,
  2, 3, 7,
  2, 7, 6,
  3, 0, 4,
  3, 4, 7
]);

const OCTA_VERTICES = new Float32Array([
  1, 0, 0,
  -1, 0, 0,
  0, 1, 0,
  0, -1, 0,
  0, 0, 1,
  0, 0, -1
]);

const OCTA_FACES = new Uint16Array([
  0, 2, 4,
  2, 1, 4,
  1, 3, 4,
  3, 0, 4,
  2, 0, 5,
  1, 2, 5,
  3, 1, 5,
  0, 3, 5
]);

const ICOSA_VERTICES = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw = [
    -1, phi, 0,
    1, phi, 0,
    -1, -phi, 0,
    1, -phi, 0,
    0, -1, phi,
    0, 1, phi,
    0, -1, -phi,
    0, 1, -phi,
    phi, 0, -1,
    phi, 0, 1,
    -phi, 0, -1,
    -phi, 0, 1
  ];
  const vertices = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) {
    const x = raw[i];
    const y = raw[i + 1];
    const z = raw[i + 2];
    const inv = 1 / Math.sqrt(x * x + y * y + z * z);
    vertices[i] = x * inv;
    vertices[i + 1] = y * inv;
    vertices[i + 2] = z * inv;
  }
  return vertices;
})();

const ICOSA_FACES = new Uint16Array([
  0, 11, 5,
  0, 5, 1,
  0, 1, 7,
  0, 7, 10,
  0, 10, 11,
  1, 5, 9,
  5, 11, 4,
  11, 10, 2,
  10, 7, 6,
  7, 1, 8,
  3, 9, 4,
  3, 4, 2,
  3, 2, 6,
  3, 6, 8,
  3, 8, 9,
  4, 9, 5,
  2, 4, 11,
  6, 2, 10,
  8, 6, 7,
  9, 8, 1
]);

const GLENZ_MODELS: Record<GlenzModel, GlenzModelDefinition> = {
  cube: {
    vertices: CUBE_VERTICES,
    faces: CUBE_FACES,
    vertexCount: CUBE_VERTICES.length / 3,
    faceCount: CUBE_FACES.length / 3
  },
  octa: {
    vertices: OCTA_VERTICES,
    faces: OCTA_FACES,
    vertexCount: OCTA_VERTICES.length / 3,
    faceCount: OCTA_FACES.length / 3
  },
  icosa: {
    vertices: ICOSA_VERTICES,
    faces: ICOSA_FACES,
    vertexCount: ICOSA_VERTICES.length / 3,
    faceCount: ICOSA_FACES.length / 3
  }
};

const TAU = Math.PI * 2;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toToggle = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value > 0;
  }
  return fallback;
};

const resolveModel = (value: unknown): GlenzModel => {
  if (value === "cube" || value === "octa" || value === "icosa") {
    return value;
  }
  return GLENZ_VECTORS_DEFAULTS.model;
};

const resolveSort = (value: unknown): GlenzSort => {
  if (value === "backToFront" || value === "none") {
    return value;
  }
  return GLENZ_VECTORS_DEFAULTS.sortFaces;
};

const resolveFocal = (value: unknown, width: number, height: number): number => {
  const fallback = Math.min(width, height) * 0.85;
  const resolved = toNumber(value, fallback);
  if (resolved <= 0) {
    return fallback;
  }
  return resolved;
};

const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967295;
  };
};

const hsvStyle = (hue: number, sat: number, lightness: number, alpha: number): string =>
  `hsla(${hue}, ${sat}%, ${lightness}%, ${alpha})`;

export const normalizeGlenzVectorsParams = (
  params: Record<string, unknown>,
  width: number,
  height: number
): GlenzVectorsParams => ({
  model: resolveModel(params.model),
  instances: clamp(Math.round(toNumber(params.instances, GLENZ_VECTORS_DEFAULTS.instances)), 1, 6),
  camDist: clamp(toNumber(params.camDist, GLENZ_VECTORS_DEFAULTS.camDist), 2.2, 6.5),
  focal: resolveFocal(params.focal, width, height),
  rotXSpeed: clamp(toNumber(params.rotXSpeed, GLENZ_VECTORS_DEFAULTS.rotXSpeed), 0, 2.5),
  rotYSpeed: clamp(toNumber(params.rotYSpeed, GLENZ_VECTORS_DEFAULTS.rotYSpeed), 0, 2.5),
  rotZSpeed: clamp(toNumber(params.rotZSpeed, GLENZ_VECTORS_DEFAULTS.rotZSpeed), 0, 2.0),
  baseHue: toNumber(params.baseHue, GLENZ_VECTORS_DEFAULTS.baseHue),
  hueSpeed: toNumber(params.hueSpeed, GLENZ_VECTORS_DEFAULTS.hueSpeed),
  sat: clamp(toNumber(params.sat, GLENZ_VECTORS_DEFAULTS.sat), 0, 100),
  lightness: clamp(toNumber(params.lightness, GLENZ_VECTORS_DEFAULTS.lightness), 0, 100),
  faceAlpha: clamp(toNumber(params.faceAlpha, GLENZ_VECTORS_DEFAULTS.faceAlpha), 0, 1),
  edge: toToggle(params.edge, GLENZ_VECTORS_DEFAULTS.edge),
  edgeAlpha: clamp(toNumber(params.edgeAlpha, GLENZ_VECTORS_DEFAULTS.edgeAlpha), 0, 1),
  lineWidth: clamp(toNumber(params.lineWidth, GLENZ_VECTORS_DEFAULTS.lineWidth), 0.5, 6),
  trailFade: clamp(toNumber(params.trailFade, GLENZ_VECTORS_DEFAULTS.trailFade), 0, 1),
  sortFaces: resolveSort(params.sortFaces),
  audioReact: clamp(toNumber(params.audioReact, GLENZ_VECTORS_DEFAULTS.audioReact), 0, 1),
  beatKick: clamp(toNumber(params.beatKick, GLENZ_VECTORS_DEFAULTS.beatKick), 0, 1),
  seed: Math.round(toNumber(params.seed, GLENZ_VECTORS_DEFAULTS.seed))
});

export const getGlenzModel = (model: GlenzModel): GlenzModelDefinition => GLENZ_MODELS[model];

export class GlenzVectorsEffect implements Effect {
  private lastTime = 0;
  private beatPulse = 0;
  private proj: Float32Array = new Float32Array(0);
  private depth: Float32Array = new Float32Array(0);
  private faceDepths: Float32Array = new Float32Array(0);
  private faceOrder: number[] = [];
  private instanceOffsets: Float32Array = new Float32Array(0);
  private lastSeed = GLENZ_VECTORS_DEFAULTS.seed;

  private ensureBuffers(model: GlenzModelDefinition): void {
    if (this.proj.length !== model.vertexCount * 2) {
      this.proj = new Float32Array(model.vertexCount * 2);
      this.depth = new Float32Array(model.vertexCount);
    }
    if (this.faceDepths.length !== model.faceCount) {
      this.faceDepths = new Float32Array(model.faceCount);
    }
    if (this.faceOrder.length !== model.faceCount) {
      this.faceOrder = Array.from({ length: model.faceCount }, (_, index) => index);
    }
  }

  private ensureInstances(count: number, seed: number): void {
    if (this.instanceOffsets.length !== count * 4 || this.lastSeed !== seed) {
      this.instanceOffsets = new Float32Array(count * 4);
      const rng = mulberry32(seed || 1);
      for (let i = 0; i < count; i += 1) {
        const angle = rng() * TAU;
        const radius = 0.6 + rng() * 0.7;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.6;
        const z = (rng() - 0.5) * 0.9;
        const phase = rng() * TAU;
        const base = i * 4;
        this.instanceOffsets[base] = x;
        this.instanceOffsets[base + 1] = y;
        this.instanceOffsets[base + 2] = z;
        this.instanceOffsets[base + 3] = phase;
      }
      this.lastSeed = seed;
    }
  }

  reset(): void {
    this.lastTime = 0;
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const settings = normalizeGlenzVectorsParams(params, width, height);
    const model = getGlenzModel(settings.model);
    this.ensureBuffers(model);
    this.ensureInstances(settings.instances, settings.seed);

    const frameDt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;

    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - frameDt * 6);
    }

    const audioBoost = settings.audioReact * audio.bass;
    const beatBoost = settings.beatKick * this.beatPulse;
    const rotKick = 1 + beatBoost * 0.6;
    const faceAlpha = clamp(settings.faceAlpha * (1 + audioBoost * 0.3 + beatBoost * 0.8), 0, 0.6);
    const focal = settings.focal * (1 + audioBoost * 0.12);
    const camDist = settings.camDist;

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = settings.trailFade > 0 ? `rgba(0, 0, 0, ${settings.trailFade})` : "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const near = camDist - 1.4;
    const far = camDist + 3.4;

    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "round";

    const { vertices, faces, vertexCount, faceCount } = model;
    const proj = this.proj;
    const depth = this.depth;
    const faceDepths = this.faceDepths;
    const faceOrder = this.faceOrder;

    for (let instanceIndex = 0; instanceIndex < settings.instances; instanceIndex += 1) {
      const base = instanceIndex * 4;
      const offsetX = this.instanceOffsets[base];
      const offsetY = this.instanceOffsets[base + 1];
      const offsetZ = this.instanceOffsets[base + 2];
      const phase = this.instanceOffsets[base + 3];
      const ax = time * settings.rotXSpeed * rotKick + phase;
      const ay = time * settings.rotYSpeed * rotKick + phase * 0.7;
      const az = time * settings.rotZSpeed * rotKick + phase * 0.4;
      const sinX = Math.sin(ax);
      const cosX = Math.cos(ax);
      const sinY = Math.sin(ay);
      const cosY = Math.cos(ay);
      const sinZ = Math.sin(az);
      const cosZ = Math.cos(az);

      for (let v = 0; v < vertexCount; v += 1) {
        const idx = v * 3;
        const x0 = vertices[idx];
        const y0 = vertices[idx + 1];
        const z0 = vertices[idx + 2];

        const y1 = y0 * cosX - z0 * sinX;
        const z1 = y0 * sinX + z0 * cosX;
        const x2 = x0 * cosY + z1 * sinY;
        const z2 = -x0 * sinY + z1 * cosY;
        const x3 = x2 * cosZ - y1 * sinZ;
        const y3 = x2 * sinZ + y1 * cosZ;

        const x = x3 + offsetX;
        const y = y3 + offsetY;
        const z = z2 + offsetZ;

        const zCam = z + camDist;
        const pIndex = v * 2;
        proj[pIndex] = cx + (x / zCam) * focal;
        proj[pIndex + 1] = cy + (y / zCam) * focal;
        depth[v] = zCam;
      }

      for (let f = 0; f < faceCount; f += 1) {
        const faceIndex = f * 3;
        const i0 = faces[faceIndex];
        const i1 = faces[faceIndex + 1];
        const i2 = faces[faceIndex + 2];
        faceDepths[f] = (depth[i0] + depth[i1] + depth[i2]) / 3;
      }

      if (settings.sortFaces === "backToFront") {
        faceOrder.sort((a, b) => faceDepths[b] - faceDepths[a]);
      }

      const baseHue = settings.baseHue + time * settings.hueSpeed + instanceIndex * 70;

      const drawFaces = (hueOffset: number, alphaScale: number): void => {
        const hue = (baseHue + hueOffset) % 360;
        for (let f = 0; f < faceCount; f += 1) {
          const faceIndex = settings.sortFaces === "backToFront" ? faceOrder[f] : f;
          const depthAvg = faceDepths[faceIndex];
          const brightness = clamp01(1 - (depthAvg - near) / (far - near));
          const alpha = faceAlpha * alphaScale * (0.35 + 0.65 * brightness);
          const lightness = clamp(settings.lightness + brightness * 12, 0, 100);
          const triIndex = faceIndex * 3;
          const i0 = faces[triIndex];
          const i1 = faces[triIndex + 1];
          const i2 = faces[triIndex + 2];

          ctx.beginPath();
          ctx.moveTo(proj[i0 * 2], proj[i0 * 2 + 1]);
          ctx.lineTo(proj[i1 * 2], proj[i1 * 2 + 1]);
          ctx.lineTo(proj[i2 * 2], proj[i2 * 2 + 1]);
          ctx.closePath();
          ctx.fillStyle = hsvStyle(hue, settings.sat, lightness, alpha);
          ctx.fill();
        }
      };

      drawFaces(0, 1);
      drawFaces(30, 0.6);

      if (settings.edge) {
        ctx.globalCompositeOperation = "screen";
        ctx.lineWidth = settings.lineWidth;
        ctx.strokeStyle = `rgba(255, 255, 255, ${settings.edgeAlpha})`;
        for (let f = 0; f < faceCount; f += 1) {
          const faceIndex = settings.sortFaces === "backToFront" ? faceOrder[f] : f;
          const triIndex = faceIndex * 3;
          const i0 = faces[triIndex];
          const i1 = faces[triIndex + 1];
          const i2 = faces[triIndex + 2];
          ctx.beginPath();
          ctx.moveTo(proj[i0 * 2], proj[i0 * 2 + 1]);
          ctx.lineTo(proj[i1 * 2], proj[i1 * 2 + 1]);
          ctx.lineTo(proj[i2 * 2], proj[i2 * 2 + 1]);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "lighter";
      }
    }
  }
}
