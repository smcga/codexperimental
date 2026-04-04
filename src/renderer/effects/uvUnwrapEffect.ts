import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type Vec3 = { x: number; y: number; z: number };

type MeshVertex = {
  pos3d: Vec3;
  posUv: Vec3;
  u: number;
  v: number;
  faceId: number;
};

type FaceDefinition = {
  id: number;
  corners3d: [Vec3, Vec3, Vec3, Vec3];
  normal: Vec3;
  uvCenter: { x: number; y: number };
};

type UvUnwrapParams = {
  unwrap: number;
  uvScale: number;
  cameraDist: number;
  rotationSpeed: number;
  edgeStrength: number;
  explode: number;
};

type ProjectedVertex = {
  x: number;
  y: number;
  z: number;
  u: number;
  v: number;
  faceId: number;
};

type Triangle = { a: number; b: number; c: number; faceId: number };

export const UV_UNWRAP_DEFAULTS = {
  unwrap: 0,
  uvScale: 2,
  cameraDist: 3,
  rotationSpeed: 0.6,
  edgeStrength: 1,
  explode: 0.15
} as const;

const FACES: FaceDefinition[] = [
  {
    id: 0,
    corners3d: [
      { x: -1, y: -1, z: 1 },
      { x: 1, y: -1, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: -1, y: 1, z: 1 }
    ],
    normal: { x: 0, y: 0, z: 1 },
    uvCenter: { x: 0, y: 0 }
  },
  {
    id: 1,
    corners3d: [
      { x: -1, y: -1, z: -1 },
      { x: -1, y: -1, z: 1 },
      { x: -1, y: 1, z: 1 },
      { x: -1, y: 1, z: -1 }
    ],
    normal: { x: -1, y: 0, z: 0 },
    uvCenter: { x: -1, y: 0 }
  },
  {
    id: 2,
    corners3d: [
      { x: 1, y: -1, z: 1 },
      { x: 1, y: -1, z: -1 },
      { x: 1, y: 1, z: -1 },
      { x: 1, y: 1, z: 1 }
    ],
    normal: { x: 1, y: 0, z: 0 },
    uvCenter: { x: 1, y: 0 }
  },
  {
    id: 3,
    corners3d: [
      { x: 1, y: -1, z: -1 },
      { x: -1, y: -1, z: -1 },
      { x: -1, y: 1, z: -1 },
      { x: 1, y: 1, z: -1 }
    ],
    normal: { x: 0, y: 0, z: -1 },
    uvCenter: { x: 2, y: 0 }
  },
  {
    id: 4,
    corners3d: [
      { x: -1, y: 1, z: 1 },
      { x: 1, y: 1, z: 1 },
      { x: 1, y: 1, z: -1 },
      { x: -1, y: 1, z: -1 }
    ],
    normal: { x: 0, y: 1, z: 0 },
    uvCenter: { x: 0, y: -1 }
  },
  {
    id: 5,
    corners3d: [
      { x: -1, y: -1, z: -1 },
      { x: 1, y: -1, z: -1 },
      { x: 1, y: -1, z: 1 },
      { x: -1, y: -1, z: 1 }
    ],
    normal: { x: 0, y: -1, z: 0 },
    uvCenter: { x: 0, y: 1 }
  }
];

const UV_CENTER_OFFSET_X = 0.5;

const meshVertices: MeshVertex[] = [];
const triangles: Triangle[] = [];

for (const face of FACES) {
  const baseIndex = meshVertices.length;
  const localUvs = [
    { u: 0, v: 0 },
    { u: 1, v: 0 },
    { u: 1, v: 1 },
    { u: 0, v: 1 }
  ] as const;

  for (let i = 0; i < 4; i += 1) {
    const uv = localUvs[i];
    meshVertices.push({
      pos3d: face.corners3d[i],
      posUv: {
        x: face.uvCenter.x + (uv.u - 0.5) - UV_CENTER_OFFSET_X,
        y: face.uvCenter.y + (uv.v - 0.5),
        z: 0
      },
      u: uv.u,
      v: uv.v,
      faceId: face.id
    });
  }

  triangles.push({ a: baseIndex, b: baseIndex + 1, c: baseIndex + 2, faceId: face.id });
  triangles.push({ a: baseIndex, b: baseIndex + 2, c: baseIndex + 3, faceId: face.id });
}

const resolvedVertices: ProjectedVertex[] = new Array(meshVertices.length).fill(null).map(() => ({
  x: 0,
  y: 0,
  z: 0,
  u: 0,
  v: 0,
  faceId: 0
}));

const fract = (value: number): number => value - Math.floor(value);

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveUvUnwrapParams = (params: Record<string, unknown>): UvUnwrapParams => ({
  unwrap: clamp(toNumber(params.unwrap, UV_UNWRAP_DEFAULTS.unwrap), 0, 1),
  uvScale: clamp(toNumber(params.uvScale, UV_UNWRAP_DEFAULTS.uvScale), 1, 3.5),
  cameraDist: clamp(toNumber(params.cameraDist, UV_UNWRAP_DEFAULTS.cameraDist), 2.2, 6),
  rotationSpeed: clamp(toNumber(params.rotationSpeed, UV_UNWRAP_DEFAULTS.rotationSpeed), -2, 2),
  edgeStrength: clamp(toNumber(params.edgeStrength, UV_UNWRAP_DEFAULTS.edgeStrength), 0.2, 2.5),
  explode: clamp(toNumber(params.explode, UV_UNWRAP_DEFAULTS.explode), 0, 1)
});

export class UvUnwrapEffect implements Effect {
  private beatPulse = 0;

  reset(): void {
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const config = resolveUvUnwrapParams(params as Record<string, unknown>);
    const beatKick = audio.beat ? 0.15 : 0;
    this.beatPulse = Math.max(audio.beat ? 1 : this.beatPulse - delta * 7, 0);
    const unwrap = clamp(config.unwrap + audio.bass * 0.5 + beatKick, 0, 1);
    const pulseStretch = 1 + this.beatPulse * 0.08;
    const uvDriftMix = clamp((unwrap - 0.7) / 0.3, 0, 1);

    const rotateScale = 1 - uvDriftMix * 0.85;
    const rotationY = time * config.rotationSpeed * rotateScale;
    const rotationX = time * config.rotationSpeed * 0.57 * rotateScale;
    const sinY = Math.sin(rotationY);
    const cosY = Math.cos(rotationY);
    const sinX = Math.sin(rotationX);
    const cosX = Math.cos(rotationX);

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const fov = Math.min(width, height) * 0.88;

    ctx.fillStyle = "rgb(4, 7, 12)";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < meshVertices.length; i += 1) {
      const source = meshVertices[i];
      const face = FACES[source.faceId];
      const explodeFactor = config.explode * (0.5 + 0.5 * Math.sin(time * 0.6)) * (1 - Math.abs(unwrap - 0.5) * 1.7);
      const scale3d = pulseStretch;
      const x3 = source.pos3d.x * scale3d + face.normal.x * explodeFactor;
      const y3 = source.pos3d.y * scale3d + face.normal.y * explodeFactor;
      const z3 = source.pos3d.z * scale3d + face.normal.z * explodeFactor;
      const xUv = source.posUv.x * config.uvScale;
      const yUv = source.posUv.y * config.uvScale;

      let x = x3 * (1 - unwrap) + xUv * unwrap;
      let y = y3 * (1 - unwrap) + yUv * unwrap;
      let z = z3 * (1 - unwrap);

      const rx = x * cosY + z * sinY;
      const rz = -x * sinY + z * cosY;
      const ry = y * cosX - rz * sinX;
      const rz2 = y * sinX + rz * cosX;

      x = rx + Math.sin(time * 0.5) * 0.1 * uvDriftMix;
      y = ry + Math.cos(time * 0.4) * 0.1 * uvDriftMix;
      z = rz2;

      const depth = z + config.cameraDist;
      const perspective = fov / Math.max(0.25, fov + depth * 80);
      resolvedVertices[i].x = centerX + x * perspective * width * 0.42;
      resolvedVertices[i].y = centerY + y * perspective * height * 0.42;
      resolvedVertices[i].z = depth;
      resolvedVertices[i].u = source.u;
      resolvedVertices[i].v = source.v;
      resolvedVertices[i].faceId = source.faceId;
    }

    const sorted = triangles
      .map((triangle) => ({
        triangle,
        depth: (resolvedVertices[triangle.a].z + resolvedVertices[triangle.b].z + resolvedVertices[triangle.c].z) / 3
      }))
      .sort((left, right) => right.depth - left.depth);

    for (const item of sorted) {
      const tri = item.triangle;
      const a = resolvedVertices[tri.a];
      const b = resolvedVertices[tri.b];
      const c = resolvedVertices[tri.c];

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();

      const avgU = (a.u + b.u + c.u) / 3;
      const avgV = (a.v + b.v + c.v) / 3;
      const gridMark = Math.min(
        Math.abs(fract(avgU * 10) - 0.5),
        Math.abs(fract(avgV * 10) - 0.5)
      );
      const gridGlow = gridMark < 0.08 ? 14 : 0;
      const hue = 180 + avgU * 55 - avgV * 30 + tri.faceId * 8;
      const light = 26 + avgV * 24 + gridGlow + this.beatPulse * 8;
      ctx.fillStyle = `hsl(${hue.toFixed(1)} 60% ${light.toFixed(1)}%)`;
      ctx.fill();
    }

    const edgeBase = 1.2 + config.edgeStrength * 1.6;
    const seamBoost = 1 + unwrap * 0.8;

    for (let faceId = 0; faceId < FACES.length; faceId += 1) {
      const i0 = faceId * 4;
      const i1 = i0 + 1;
      const i2 = i0 + 2;
      const i3 = i0 + 3;
      const edges: Array<[number, number]> = [
        [i0, i1],
        [i1, i2],
        [i2, i3],
        [i3, i0]
      ];
      for (const [start, end] of edges) {
        const a = resolvedVertices[start];
        const b = resolvedVertices[end];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = edgeBase * seamBoost;
        ctx.strokeStyle = `rgba(220, 255, 255, ${0.35 + 0.45 * config.edgeStrength})`;
        ctx.stroke();
      }
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, width, height);
  }
}

const uvUnwrapSingleton = new UvUnwrapEffect();

export const uvUnwrapEffect: Effect & { name: string } = {
  name: "uvUnwrap",
  render: (context: EffectRenderContext) => uvUnwrapSingleton.render(context),
  reset: () => uvUnwrapSingleton.reset?.()
};
