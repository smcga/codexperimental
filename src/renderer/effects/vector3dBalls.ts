import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;
const TABLE_SIZE = 2048;
const SIN_LUT = new Float32Array(TABLE_SIZE);
const COS_LUT = new Float32Array(TABLE_SIZE);

for (let i = 0; i < TABLE_SIZE; i += 1) {
  const angle = (i / TABLE_SIZE) * TAU;
  SIN_LUT[i] = Math.sin(angle);
  COS_LUT[i] = Math.cos(angle);
}

const lookupLut = (angle: number, table: Float32Array): number => {
  const wrapped = angle % TAU;
  const normalized = wrapped < 0 ? wrapped + TAU : wrapped;
  const index = Math.floor((normalized / TAU) * TABLE_SIZE) % TABLE_SIZE;
  return table[index];
};

const lutSin = (angle: number): number => lookupLut(angle, SIN_LUT);
const lutCos = (angle: number): number => lookupLut(angle, COS_LUT);

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

const CUBE_EDGES = [
  0, 1,
  1, 2,
  2, 3,
  3, 0,
  4, 5,
  5, 6,
  6, 7,
  7, 4,
  0, 4,
  1, 5,
  2, 6,
  3, 7
];

const PALETTES = {
  c64: [
    [0, 0, 0],
    [255, 255, 255],
    [136, 0, 0],
    [170, 255, 238],
    [204, 68, 204],
    [0, 204, 85],
    [0, 0, 170],
    [238, 238, 119],
    [221, 136, 85],
    [102, 68, 0],
    [255, 119, 119],
    [51, 51, 51],
    [119, 119, 119],
    [170, 255, 102],
    [0, 136, 255],
    [187, 187, 187]
  ],
  spectrum: [
    [0, 0, 0],
    [0, 0, 205],
    [205, 0, 0],
    [205, 0, 205],
    [0, 205, 0],
    [0, 205, 205],
    [205, 205, 0],
    [205, 205, 205]
  ],
  rainbow: [
    [255, 40, 40],
    [255, 140, 40],
    [255, 220, 40],
    [180, 255, 40],
    [40, 255, 120],
    [40, 255, 220],
    [40, 140, 255],
    [120, 40, 255],
    [220, 40, 255],
    [255, 40, 180]
  ]
} as const;

type Vector3dModel = "cube" | "sphere" | "torus";

type Vector3dPalette = keyof typeof PALETTES;

export const VECTOR3D_BALLS_DEFAULTS = {
  model: "cube" as Vector3dModel,
  pointCount: 420,
  wireframe: 1,
  roundDots: 0,
  baseDotSize: 1.8,
  dotDepthScale: 2.0,
  lineWidth: 1.6,
  camDist: 3.2,
  rotXSpeed: 0.35,
  rotYSpeed: 0.5,
  rotZSpeed: 0.08,
  trail: 0,
  stripeFreq: 5.0,
  stripeSpeed: 0.18,
  stripeStrength: 0.75,
  palette: "c64" as Vector3dPalette,
  audioReact: 0.45,
  beatKick: 0.45,
  seed: 11
};

export type Vector3dBallsParams = {
  model: Vector3dModel;
  pointCount: number;
  wireframe: boolean;
  roundDots: boolean;
  baseDotSize: number;
  dotDepthScale: number;
  lineWidth: number;
  camDist: number;
  rotXSpeed: number;
  rotYSpeed: number;
  rotZSpeed: number;
  trail: number;
  stripeFreq: number;
  stripeSpeed: number;
  stripeStrength: number;
  palette: Vector3dPalette;
  audioReact: number;
  beatKick: number;
  seed: number;
};

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

const resolveModel = (value: unknown): Vector3dModel => {
  if (value === "sphere" || value === "torus" || value === "cube") {
    return value;
  }
  return VECTOR3D_BALLS_DEFAULTS.model;
};

const resolvePalette = (value: unknown): Vector3dPalette => {
  if (value === "spectrum" || value === "rainbow" || value === "c64") {
    return value;
  }
  return VECTOR3D_BALLS_DEFAULTS.palette;
};

export const normalizeVector3dBallsParams = (params: Record<string, unknown>): Vector3dBallsParams => {
  const pointCount = clamp(Math.round(toNumber(params.pointCount, VECTOR3D_BALLS_DEFAULTS.pointCount)), 80, 2000);
  return {
    model: resolveModel(params.model),
    pointCount,
    wireframe: toToggle(params.wireframe, VECTOR3D_BALLS_DEFAULTS.wireframe > 0),
    roundDots: toToggle(params.roundDots, VECTOR3D_BALLS_DEFAULTS.roundDots > 0),
    baseDotSize: clamp(toNumber(params.baseDotSize, VECTOR3D_BALLS_DEFAULTS.baseDotSize), 0.5, 6),
    dotDepthScale: clamp(toNumber(params.dotDepthScale, VECTOR3D_BALLS_DEFAULTS.dotDepthScale), 0, 6),
    lineWidth: clamp(toNumber(params.lineWidth, VECTOR3D_BALLS_DEFAULTS.lineWidth), 0.5, 6),
    camDist: clamp(toNumber(params.camDist, VECTOR3D_BALLS_DEFAULTS.camDist), 2.4, 6),
    rotXSpeed: clamp(toNumber(params.rotXSpeed, VECTOR3D_BALLS_DEFAULTS.rotXSpeed), 0, 2.5),
    rotYSpeed: clamp(toNumber(params.rotYSpeed, VECTOR3D_BALLS_DEFAULTS.rotYSpeed), 0, 2.5),
    rotZSpeed: clamp(toNumber(params.rotZSpeed, VECTOR3D_BALLS_DEFAULTS.rotZSpeed), 0, 1.5),
    trail: clamp(toNumber(params.trail, VECTOR3D_BALLS_DEFAULTS.trail), 0, 0.85),
    stripeFreq: clamp(toNumber(params.stripeFreq, VECTOR3D_BALLS_DEFAULTS.stripeFreq), 1, 14),
    stripeSpeed: clamp(toNumber(params.stripeSpeed, VECTOR3D_BALLS_DEFAULTS.stripeSpeed), -2, 2),
    stripeStrength: clamp(toNumber(params.stripeStrength, VECTOR3D_BALLS_DEFAULTS.stripeStrength), 0, 1),
    palette: resolvePalette(params.palette),
    audioReact: clamp(toNumber(params.audioReact, VECTOR3D_BALLS_DEFAULTS.audioReact), 0, 1),
    beatKick: clamp(toNumber(params.beatKick, VECTOR3D_BALLS_DEFAULTS.beatKick), 0, 1),
    seed: Math.round(toNumber(params.seed, VECTOR3D_BALLS_DEFAULTS.seed))
  };
};

const buildCubePoints = (count: number, rng: () => number): Float32Array => {
  const points = new Float32Array(count * 3);
  const baseCount = Math.floor(count / 6);
  let remainder = count % 6;
  let offset = 0;

  const faces: Array<{ axis: "x" | "y" | "z"; sign: number }> = [
    { axis: "x", sign: -1 },
    { axis: "x", sign: 1 },
    { axis: "y", sign: -1 },
    { axis: "y", sign: 1 },
    { axis: "z", sign: -1 },
    { axis: "z", sign: 1 }
  ];

  faces.forEach((face) => {
    const faceCount = baseCount + (remainder > 0 ? 1 : 0);
    remainder = Math.max(0, remainder - 1);
    if (faceCount === 0) {
      return;
    }
    const grid = Math.max(1, Math.ceil(Math.sqrt(faceCount)));
    const step = grid === 1 ? 0 : 2 / (grid - 1);
    let placed = 0;
    for (let v = 0; v < grid && placed < faceCount; v += 1) {
      for (let u = 0; u < grid && placed < faceCount; u += 1) {
        const jitterU = (rng() - 0.5) * step * 0.6;
        const jitterV = (rng() - 0.5) * step * 0.6;
        const a = -1 + u * step + jitterU;
        const b = -1 + v * step + jitterV;
        let x = a;
        let y = b;
        let z = 0;

        if (face.axis === "x") {
          x = face.sign;
          y = a;
          z = b;
        } else if (face.axis === "y") {
          x = a;
          y = face.sign;
          z = b;
        } else {
          x = a;
          y = b;
          z = face.sign;
        }

        points[offset++] = x;
        points[offset++] = y;
        points[offset++] = z;
        placed += 1;
      }
    }
  });

  return points;
};

const buildSpherePoints = (count: number, rng: () => number): Float32Array => {
  const points = new Float32Array(count * 3);
  let offset = 0;
  for (let i = 0; i < count; i += 1) {
    const u = rng();
    const v = rng();
    const theta = u * TAU;
    const phi = Math.acos(1 - 2 * v);
    const sinPhi = Math.sin(phi);
    const jitter = (rng() - 0.5) * 0.03;
    points[offset++] = Math.cos(theta) * sinPhi * (1 + jitter);
    points[offset++] = Math.cos(phi) * (1 + jitter);
    points[offset++] = Math.sin(theta) * sinPhi * (1 + jitter);
  }
  return points;
};

const buildTorusPoints = (count: number, rng: () => number): Float32Array => {
  const points = new Float32Array(count * 3);
  const majorRadius = 1.1;
  const minorRadius = 0.45;
  let offset = 0;
  for (let i = 0; i < count; i += 1) {
    const u = rng() * TAU;
    const v = rng() * TAU;
    const tube = minorRadius * Math.cos(v);
    const jitter = (rng() - 0.5) * 0.02;
    const radius = majorRadius + tube + jitter;
    points[offset++] = Math.cos(u) * radius;
    points[offset++] = Math.sin(v) * minorRadius;
    points[offset++] = Math.sin(u) * radius;
  }
  return points;
};

export const buildVector3dPoints = (model: Vector3dModel, count: number, seed: number): Float32Array => {
  const rng = mulberry32(seed);
  if (model === "sphere") {
    return buildSpherePoints(count, rng);
  }
  if (model === "torus") {
    return buildTorusPoints(count, rng);
  }
  return buildCubePoints(count, rng);
};

export class Vector3dBallsEffect implements Effect {
  private points = new Float32Array(0);
  private projectedX = new Float32Array(0);
  private projectedY = new Float32Array(0);
  private depths = new Float32Array(0);
  private bins: number[][] = [];
  private vertexX = new Float32Array(8);
  private vertexY = new Float32Array(8);
  private vertexDepth = new Float32Array(8);
  private lastModel: Vector3dModel | null = null;
  private lastPointCount = 0;
  private lastSeed = Number.NaN;
  private kick = 0;
  private smoothBass = 0;
  private smoothKick = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const settings = normalizeVector3dBallsParams(params as Record<string, unknown>);
    this.ensureGeometry(settings);

    const clampedDelta = clamp(delta, 0, 0.05);
    const bassTarget = clamp((audio?.bass ?? 0) * settings.audioReact, 0, 1);

    if (audio?.beat) {
      this.kick = 1;
    } else {
      this.kick = Math.max(0, this.kick - clampedDelta * 1.6);
    }

    const smoothFactor = clamp(clampedDelta * 3, 0, 1);
    this.smoothBass += (bassTarget - this.smoothBass) * smoothFactor;
    this.smoothKick += (this.kick - this.smoothKick) * smoothFactor;

    const kickBoost = this.smoothKick * settings.beatKick;
    const speedBoost = 1 + this.smoothBass * 0.22 + kickBoost * 0.3;

    const ax = time * settings.rotXSpeed * speedBoost;
    const ay = time * settings.rotYSpeed * speedBoost;
    const az = time * settings.rotZSpeed * (1 + kickBoost * 0.4);
    const sinX = lutSin(ax);
    const cosX = lutCos(ax);
    const sinY = lutSin(ay);
    const cosY = lutCos(ay);
    const sinZ = lutSin(az);
    const cosZ = lutCos(az);

    if (settings.trail > 0) {
      ctx.save();
      ctx.globalAlpha = settings.trail;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }

    const palette = PALETTES[settings.palette];
    const focal = Math.min(width, height) * 0.75;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const modelScale = settings.model === "torus" ? 0.75 : settings.model === "sphere" ? 1.1 : 1.15;

    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < this.points.length; i += 3) {
      const index = i / 3;
      const x = this.points[i] * modelScale;
      const y = this.points[i + 1] * modelScale;
      const z = this.points[i + 2] * modelScale;

      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      const zCam = z2 + settings.camDist;
      this.depths[index] = zCam;
      if (zCam < minZ) {
        minZ = zCam;
      }
      if (zCam > maxZ) {
        maxZ = zCam;
      }

      const invZ = 1 / Math.max(zCam, 0.2);
      this.projectedX[index] = x3 * invZ * focal + centerX;
      this.projectedY[index] = y3 * invZ * focal + centerY;
    }

    const depthRange = Math.max(0.001, maxZ - minZ);
    const stripeFreq = settings.stripeFreq;
    const stripeSpeed = settings.stripeSpeed;
    const stripeStrength = settings.stripeStrength;

    this.bins.forEach((bin) => {
      bin.length = 0;
    });

    for (let i = 0; i < this.depths.length; i += 1) {
      const depthNorm = clamp((this.depths[i] - minZ) / depthRange, 0, 1);
      const binIndex = Math.min(this.bins.length - 1, Math.floor(depthNorm * (this.bins.length - 1)));
      this.bins[binIndex].push(i);
    }

    if (settings.wireframe && settings.model === "cube") {
      this.renderWireframe(
        ctx,
        focal,
        centerX,
        centerY,
        settings.camDist,
        sinX,
        cosX,
        sinY,
        cosY,
        sinZ,
        cosZ,
        palette,
        kickBoost,
        settings.lineWidth
      );
    }

    for (let bin = this.bins.length - 1; bin >= 0; bin -= 1) {
      const indices = this.bins[bin];
      for (let i = 0; i < indices.length; i += 1) {
        const idx = indices[i];
        const zCam = this.depths[idx];
        const invZ = 1 / Math.max(zCam, 0.2);
        const depthNorm = clamp((zCam - minZ) / depthRange, 0, 1);
        const brightness = 1 - depthNorm;
        const size = clamp(
          settings.baseDotSize * (1 + settings.dotDepthScale * invZ) * (1 + this.smoothBass * 0.25 + kickBoost * 0.2),
          0.6,
          6
        );
        const stripePhase = (this.projectedY[idx] / height) * stripeFreq + time * stripeSpeed;
        const stripeWave = 0.5 + 0.5 * lutSin(stripePhase * TAU);
        let stripeIndex = Math.floor(stripeWave * (palette.length - 1));
        const depthBias = Math.round((1 - depthNorm) * stripeStrength * (palette.length - 1) * 0.35);
        stripeIndex = clamp(stripeIndex + depthBias, 0, palette.length - 1);

        const color = palette[stripeIndex];
        const alpha = clamp(0.12 + brightness * 0.75 + kickBoost * 0.15, 0.08, 0.95);
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;

        if (settings.roundDots) {
          ctx.beginPath();
          ctx.arc(this.projectedX[idx], this.projectedY[idx], size, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillRect(this.projectedX[idx] - size, this.projectedY[idx] - size, size * 2, size * 2);
        }
      }
    }
  }

  reset(): void {
    this.kick = 0;
    this.smoothBass = 0;
    this.smoothKick = 0;
  }

  private renderWireframe(
    ctx: CanvasRenderingContext2D,
    focal: number,
    centerX: number,
    centerY: number,
    camDist: number,
    sinX: number,
    cosX: number,
    sinY: number,
    cosY: number,
    sinZ: number,
    cosZ: number,
    palette: ReadonlyArray<Readonly<[number, number, number]>>,
    kickBoost: number,
    lineWidth: number
  ): void {
    for (let i = 0; i < CUBE_VERTICES.length; i += 3) {
      const index = i / 3;
      const x = CUBE_VERTICES[i];
      const y = CUBE_VERTICES[i + 1];
      const z = CUBE_VERTICES[i + 2];

      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;

      const x2 = x * cosY + z1 * sinY;
      const z2 = -x * sinY + z1 * cosY;

      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      const zCam = z2 + camDist;
      this.vertexDepth[index] = zCam;
      const invZ = 1 / Math.max(zCam, 0.2);
      this.vertexX[index] = x3 * invZ * focal + centerX;
      this.vertexY[index] = y3 * invZ * focal + centerY;
    }

    const color = palette[palette.length - 1];
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${clamp(0.45 + kickBoost * 0.35, 0.1, 0.9)})`;
    ctx.beginPath();
    for (let i = 0; i < CUBE_EDGES.length; i += 2) {
      const start = CUBE_EDGES[i];
      const end = CUBE_EDGES[i + 1];
      ctx.moveTo(this.vertexX[start], this.vertexY[start]);
      ctx.lineTo(this.vertexX[end], this.vertexY[end]);
    }
    ctx.stroke();
    ctx.restore();
  }

  private ensureGeometry(settings: Vector3dBallsParams): void {
    if (
      this.lastModel !== settings.model ||
      this.lastPointCount !== settings.pointCount ||
      this.lastSeed !== settings.seed
    ) {
      this.points = buildVector3dPoints(settings.model, settings.pointCount, settings.seed);
      this.projectedX = new Float32Array(settings.pointCount);
      this.projectedY = new Float32Array(settings.pointCount);
      this.depths = new Float32Array(settings.pointCount);
      this.bins = Array.from({ length: 48 }, () => []);
      this.lastModel = settings.model;
      this.lastPointCount = settings.pointCount;
      this.lastSeed = settings.seed;
    }
  }
}
