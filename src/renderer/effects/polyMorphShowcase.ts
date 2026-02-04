import { clamp, lerp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;

type StyleMode = "auto" | "solid" | "glenz" | "shaded";

type LatLonMesh = {
  uvs: Float32Array;
  faces: Uint16Array;
  vertexCount: number;
  faceCount: number;
};

type PolyMorphParams = {
  lat: number;
  lon: number;
  morphSpeed: number;
  styleSpeed: number;
  style: StyleMode;
  camDist: number;
  focalMul: number;
  rotXSpeed: number;
  rotYSpeed: number;
  rotZSpeed: number;
  sat: number;
  baseHue: number;
  hueSpeed: number;
  solidAlpha: number;
  glenzAlpha: number;
  shadedAlpha: number;
  edge: boolean;
  edgeAlpha: number;
  sortSolid: boolean;
  sortShaded: boolean;
  sortGlenz: boolean;
  audioReact: number;
  beatKick: number;
  seed: number;
};

const DEFAULTS: PolyMorphParams = {
  lat: 16,
  lon: 24,
  morphSpeed: 0.08,
  styleSpeed: 0.1,
  style: "auto",
  camDist: 3.6,
  focalMul: 0.9,
  rotXSpeed: 0.5,
  rotYSpeed: 0.8,
  rotZSpeed: 0.2,
  sat: 85,
  baseHue: 200,
  hueSpeed: 25,
  solidAlpha: 0.9,
  glenzAlpha: 0.13,
  shadedAlpha: 0.95,
  edge: true,
  edgeAlpha: 0.18,
  sortSolid: true,
  sortShaded: true,
  sortGlenz: false,
  audioReact: 0.7,
  beatKick: 0.7,
  seed: 0
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveBooleanParam = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  return fallback;
};

const resolveStyleParam = (value: unknown, fallback: StyleMode): StyleMode => {
  if (value === "auto" || value === "solid" || value === "glenz" || value === "shaded") {
    return value;
  }
  return fallback;
};

const resolveParams = (params: Record<string, unknown>): PolyMorphParams => {
  const lat = clamp(Math.round(resolveNumberParam(params.lat, DEFAULTS.lat)), 8, 28);
  const lon = clamp(Math.round(resolveNumberParam(params.lon, DEFAULTS.lon)), 12, 40);
  return {
    lat,
    lon,
    morphSpeed: Math.max(0, resolveNumberParam(params.morphSpeed, DEFAULTS.morphSpeed)),
    styleSpeed: Math.max(0, resolveNumberParam(params.styleSpeed, DEFAULTS.styleSpeed)),
    style: resolveStyleParam(params.style, DEFAULTS.style),
    camDist: clamp(resolveNumberParam(params.camDist, DEFAULTS.camDist), 2.5, 6),
    focalMul: clamp(resolveNumberParam(params.focalMul, DEFAULTS.focalMul), 0.5, 1.2),
    rotXSpeed: resolveNumberParam(params.rotXSpeed, DEFAULTS.rotXSpeed),
    rotYSpeed: resolveNumberParam(params.rotYSpeed, DEFAULTS.rotYSpeed),
    rotZSpeed: resolveNumberParam(params.rotZSpeed, DEFAULTS.rotZSpeed),
    sat: clamp(resolveNumberParam(params.sat, DEFAULTS.sat), 0, 100),
    baseHue: resolveNumberParam(params.baseHue, DEFAULTS.baseHue),
    hueSpeed: resolveNumberParam(params.hueSpeed, DEFAULTS.hueSpeed),
    solidAlpha: clamp(resolveNumberParam(params.solidAlpha, DEFAULTS.solidAlpha), 0, 1),
    glenzAlpha: clamp(resolveNumberParam(params.glenzAlpha, DEFAULTS.glenzAlpha), 0, 1),
    shadedAlpha: clamp(resolveNumberParam(params.shadedAlpha, DEFAULTS.shadedAlpha), 0, 1),
    edge: resolveBooleanParam(params.edge, DEFAULTS.edge),
    edgeAlpha: clamp(resolveNumberParam(params.edgeAlpha, DEFAULTS.edgeAlpha), 0, 1),
    sortSolid: resolveBooleanParam(params.sortSolid, DEFAULTS.sortSolid),
    sortShaded: resolveBooleanParam(params.sortShaded, DEFAULTS.sortShaded),
    sortGlenz: resolveBooleanParam(params.sortGlenz, DEFAULTS.sortGlenz),
    audioReact: clamp(resolveNumberParam(params.audioReact, DEFAULTS.audioReact), 0, 1),
    beatKick: clamp(resolveNumberParam(params.beatKick, DEFAULTS.beatKick), 0, 1),
    seed: resolveNumberParam(params.seed, DEFAULTS.seed)
  };
};

export const buildLatLonMesh = (latSegments: number, lonSegments: number): LatLonMesh => {
  const rows = latSegments + 1;
  const vertexCount = rows * lonSegments;
  const uvs = new Float32Array(vertexCount * 2);
  let cursor = 0;
  for (let v = 0; v < rows; v += 1) {
    const vNorm = latSegments === 0 ? 0 : v / latSegments;
    for (let u = 0; u < lonSegments; u += 1) {
      uvs[cursor++] = u / lonSegments;
      uvs[cursor++] = vNorm;
    }
  }

  const faceCount = latSegments * lonSegments * 2;
  const faces = new Uint16Array(faceCount * 3);
  let faceCursor = 0;
  for (let v = 0; v < latSegments; v += 1) {
    const row = v * lonSegments;
    const nextRow = (v + 1) * lonSegments;
    for (let u = 0; u < lonSegments; u += 1) {
      const nextU = (u + 1) % lonSegments;
      const i0 = row + u;
      const i1 = row + nextU;
      const i2 = nextRow + u;
      const i3 = nextRow + nextU;
      faces[faceCursor++] = i0;
      faces[faceCursor++] = i2;
      faces[faceCursor++] = i1;
      faces[faceCursor++] = i1;
      faces[faceCursor++] = i2;
      faces[faceCursor++] = i3;
    }
  }

  return {
    uvs,
    faces,
    vertexCount,
    faceCount
  };
};

const shapeSphere = (theta: number, phi: number): [number, number, number] => {
  const sinPhi = Math.sin(phi);
  return [sinPhi * Math.cos(theta), Math.cos(phi), sinPhi * Math.sin(theta)];
};

const shapeCube = (theta: number, phi: number): [number, number, number] => {
  const [x, y, z] = shapeSphere(theta, phi);
  const scale = 1 / Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  return [x * scale, y * scale, z * scale];
};

const shapeOcta = (theta: number, phi: number): [number, number, number] => {
  const [x, y, z] = shapeSphere(theta, phi);
  const scale = 1 / (Math.abs(x) + Math.abs(y) + Math.abs(z));
  return [x * scale, y * scale, z * scale];
};

const shapeSpiky = (theta: number, phi: number, seed: number): [number, number, number] => {
  const [x, y, z] = shapeSphere(theta, phi);
  const spikeA = Math.sin(theta * 3 + seed * 0.7) * Math.cos(phi * 2 + seed * 0.3);
  const spikeB = Math.sin(phi * 5 - seed * 0.4);
  const radius = 1 + spikeA * 0.25 + spikeB * 0.18;
  return [x * radius, y * radius, z * radius];
};

const shapeTorus = (theta: number, phi: number, seed: number): [number, number, number] => {
  const ring = phi * 2;
  const wobble = 0.04 * Math.sin(theta * 4 + seed * 0.5);
  const major = 0.7 + wobble;
  const minor = 0.35;
  const cosRing = Math.cos(ring);
  const sinRing = Math.sin(ring);
  const x = (major + minor * cosRing) * Math.cos(theta);
  const z = (major + minor * cosRing) * Math.sin(theta);
  const y = minor * sinRing;
  const scale = 1 / (major + minor);
  return [x * scale, y * scale, z * scale];
};

export const buildShapePositions = (uvs: Float32Array, seed: number): Float32Array[] => {
  const vertexCount = uvs.length / 2;
  const shapes = [
    new Float32Array(vertexCount * 3),
    new Float32Array(vertexCount * 3),
    new Float32Array(vertexCount * 3),
    new Float32Array(vertexCount * 3)
  ];
  for (let i = 0; i < vertexCount; i += 1) {
    const u = uvs[i * 2];
    const v = uvs[i * 2 + 1];
    const theta = u * TAU;
    const phi = v * Math.PI;
    const [cx, cy, cz] = shapeCube(theta, phi);
    const [ox, oy, oz] = shapeOcta(theta, phi);
    const [sx, sy, sz] = shapeSpiky(theta, phi, seed);
    const [tx, ty, tz] = shapeTorus(theta, phi, seed);
    const baseIndex = i * 3;
    shapes[0][baseIndex] = cx;
    shapes[0][baseIndex + 1] = cy;
    shapes[0][baseIndex + 2] = cz;
    shapes[1][baseIndex] = ox;
    shapes[1][baseIndex + 1] = oy;
    shapes[1][baseIndex + 2] = oz;
    shapes[2][baseIndex] = sx;
    shapes[2][baseIndex + 1] = sy;
    shapes[2][baseIndex + 2] = sz;
    shapes[3][baseIndex] = tx;
    shapes[3][baseIndex + 1] = ty;
    shapes[3][baseIndex + 2] = tz;
  }
  return shapes;
};

const resolveStyleWeights = (style: StyleMode, time: number, styleSpeed: number): [number, number, number] => {
  if (style !== "auto") {
    return [
      style === "solid" ? 1 : 0,
      style === "glenz" ? 1 : 0,
      style === "shaded" ? 1 : 0
    ];
  }
  const phase = (time * styleSpeed) % 3;
  if (phase < 1) {
    const t = smoothstep(0, 1, phase);
    return [1 - t, t, 0];
  }
  if (phase < 2) {
    const t = smoothstep(1, 2, phase);
    return [0, 1 - t, t];
  }
  const t = smoothstep(2, 3, phase);
  return [t, 0, 1 - t];
};

export class PolyMorphShowcaseEffect implements Effect {
  private mesh: LatLonMesh | null = null;
  private shapes: Float32Array[] = [];
  private currentPositions = new Float32Array(0);
  private rotatedPositions = new Float32Array(0);
  private projected = new Float32Array(0);
  private depths = new Float32Array(0);
  private lighting = new Float32Array(0);
  private faceDepths = new Float32Array(0);
  private faceOrder: number[] = [];
  private beatPulse = 0;
  private lastLat = 0;
  private lastLon = 0;
  private lastSeed = 0;

  private ensureMesh(lat: number, lon: number, seed: number): void {
    if (this.mesh && this.lastLat === lat && this.lastLon === lon && this.lastSeed === seed) {
      return;
    }
    this.lastLat = lat;
    this.lastLon = lon;
    this.lastSeed = seed;
    this.mesh = buildLatLonMesh(lat, lon);
    this.shapes = buildShapePositions(this.mesh.uvs, seed);
    const vertexCount = this.mesh.vertexCount;
    const faceCount = this.mesh.faceCount;
    this.currentPositions = new Float32Array(vertexCount * 3);
    this.rotatedPositions = new Float32Array(vertexCount * 3);
    this.projected = new Float32Array(vertexCount * 2);
    this.depths = new Float32Array(vertexCount);
    this.lighting = new Float32Array(vertexCount);
    this.faceDepths = new Float32Array(faceCount);
    this.faceOrder = Array.from({ length: faceCount }, (_, index) => index);
  }

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const resolved = resolveParams(params as Record<string, unknown>);
    this.ensureMesh(resolved.lat, resolved.lon, resolved.seed);
    if (!this.mesh) {
      return;
    }

    const audioReact = resolved.audioReact;
    const beatKick = resolved.beatKick;
    const beatStrength = audio.beat ? 1 : 0;
    this.beatPulse = Math.max(0, this.beatPulse - delta * 6);
    if (beatStrength > 0) {
      this.beatPulse = 1;
    }

    const morphSpeed = resolved.morphSpeed * (1 + audio.bass * 0.35 * audioReact);
    const morphPhase = (time * morphSpeed) % this.shapes.length;
    const shapeIndex = Math.floor(morphPhase);
    const nextShape = (shapeIndex + 1) % this.shapes.length;
    const morphT = smoothstep(0, 1, morphPhase - shapeIndex);
    const fromShape = this.shapes[shapeIndex];
    const toShape = this.shapes[nextShape];

    const vertexCount = this.mesh.vertexCount;
    for (let i = 0; i < vertexCount * 3; i += 1) {
      this.currentPositions[i] = lerp(fromShape[i], toShape[i], morphT);
    }

    const camDist = resolved.camDist;
    const focal = Math.min(width, height) * resolved.focalMul;
    const cx = width * 0.5;
    const cy = height * 0.5;

    const rotBoost = 1 + this.beatPulse * beatKick * 0.6 * audioReact;
    const ax = time * resolved.rotXSpeed * rotBoost;
    const ay = time * resolved.rotYSpeed * rotBoost;
    const az = time * resolved.rotZSpeed * rotBoost;
    const cosX = Math.cos(ax);
    const sinX = Math.sin(ax);
    const cosY = Math.cos(ay);
    const sinY = Math.sin(ay);
    const cosZ = Math.cos(az);
    const sinZ = Math.sin(az);

    const lightDir = { x: 0.3, y: 0.4, z: 1.0 };
    const lightLen = Math.hypot(lightDir.x, lightDir.y, lightDir.z);
    const lx = lightDir.x / lightLen;
    const ly = lightDir.y / lightLen;
    const lz = lightDir.z / lightLen;

    for (let i = 0; i < vertexCount; i += 1) {
      const baseIndex = i * 3;
      const x = this.currentPositions[baseIndex];
      const y = this.currentPositions[baseIndex + 1];
      const z = this.currentPositions[baseIndex + 2];

      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const x2 = z1 * sinY + x * cosY;
      const z2 = z1 * cosY - x * sinY;
      const x3 = x2 * cosZ - y1 * sinZ;
      const y3 = x2 * sinZ + y1 * cosZ;

      this.rotatedPositions[baseIndex] = x3;
      this.rotatedPositions[baseIndex + 1] = y3;
      this.rotatedPositions[baseIndex + 2] = z2;

      const zCam = z2 + camDist;
      this.depths[i] = zCam;
      const px = cx + (x3 / zCam) * focal;
      const py = cy + (y3 / zCam) * focal;
      const projIndex = i * 2;
      this.projected[projIndex] = px;
      this.projected[projIndex + 1] = py;

      const normalLen = Math.hypot(x3, y3, z2) || 1;
      const nx = x3 / normalLen;
      const ny = y3 / normalLen;
      const nz = z2 / normalLen;
      const dot = nx * lx + ny * ly + nz * lz;
      this.lighting[i] = clamp01(0.25 + dot * 0.75);
    }

    const faceCount = this.mesh.faceCount;
    const faces = this.mesh.faces;
    for (let faceIndex = 0; faceIndex < faceCount; faceIndex += 1) {
      const faceBase = faceIndex * 3;
      const i0 = faces[faceBase];
      const i1 = faces[faceBase + 1];
      const i2 = faces[faceBase + 2];
      this.faceDepths[faceIndex] = (this.depths[i0] + this.depths[i1] + this.depths[i2]) / 3;
    }

    const needSort = resolved.sortSolid || resolved.sortShaded;
    if (needSort) {
      this.faceOrder.sort((a, b) => this.faceDepths[b] - this.faceDepths[a]);
    }

    const bgAlpha = 0.22;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(5, 7, 12, ${bgAlpha})`;
    ctx.fillRect(0, 0, width, height);

    let [weightSolid, weightGlenz, weightShaded] = resolveStyleWeights(resolved.style, time, resolved.styleSpeed);
    weightGlenz = clamp01(weightGlenz + this.beatPulse * beatKick * 0.25 * audioReact);

    const hueBase = resolved.baseHue + time * resolved.hueSpeed;
    const saturation = clamp(resolved.sat * (1 + audio.bass * 0.2 * audioReact), 0, 100);

    const drawTriangle = (i0: number, i1: number, i2: number): void => {
      if (this.depths[i0] <= 0 || this.depths[i1] <= 0 || this.depths[i2] <= 0) {
        return;
      }
      ctx.beginPath();
      ctx.moveTo(this.projected[i0 * 2], this.projected[i0 * 2 + 1]);
      ctx.lineTo(this.projected[i1 * 2], this.projected[i1 * 2 + 1]);
      ctx.lineTo(this.projected[i2 * 2], this.projected[i2 * 2 + 1]);
      ctx.closePath();
    };

    const renderFaces = (order: number[], fillStyle: (faceIndex: number) => string, alpha: number, blend: GlobalCompositeOperation) => {
      if (alpha <= 0.001) {
        return;
      }
      ctx.globalCompositeOperation = blend;
      ctx.globalAlpha = alpha;
      order.forEach((faceIndex) => {
        const faceBase = faceIndex * 3;
        const i0 = faces[faceBase];
        const i1 = faces[faceBase + 1];
        const i2 = faces[faceBase + 2];
        drawTriangle(i0, i1, i2);
        ctx.fillStyle = fillStyle(faceIndex);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const solidOrder = resolved.sortSolid ? this.faceOrder : Array.from({ length: faceCount }, (_, i) => i);
    const shadedOrder = resolved.sortShaded ? this.faceOrder : Array.from({ length: faceCount }, (_, i) => i);
    const glenzOrder = resolved.sortGlenz ? this.faceOrder : Array.from({ length: faceCount }, (_, i) => i);

    renderFaces(
      solidOrder,
      (faceIndex) => {
        const depth = this.faceDepths[faceIndex];
        const depthCue = clamp01((depth - (camDist - 1.2)) / 2.6);
        const lightness = 26 + depthCue * 34;
        const hue = hueBase + depthCue * 18;
        return `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
      },
      resolved.solidAlpha * weightSolid,
      "source-over"
    );

    renderFaces(
      glenzOrder,
      (faceIndex) => {
        const depth = this.faceDepths[faceIndex];
        const depthCue = clamp01((depth - (camDist - 1.2)) / 2.6);
        const lightness = 50 + depthCue * 18;
        const hue = hueBase + 20 + depthCue * 10;
        return `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
      },
      resolved.glenzAlpha * weightGlenz,
      "lighter"
    );

    renderFaces(
      shadedOrder,
      (faceIndex) => {
        const faceBase = faceIndex * 3;
        const i0 = faces[faceBase];
        const i1 = faces[faceBase + 1];
        const i2 = faces[faceBase + 2];
        const lit = (this.lighting[i0] + this.lighting[i1] + this.lighting[i2]) / 3;
        const lightness = 18 + lit * 55;
        return `hsla(${hueBase}, ${saturation}%, ${lightness}%, 1)`;
      },
      resolved.shadedAlpha * weightShaded,
      "source-over"
    );

    if (resolved.edge) {
      const edgeWeight = 0.3 + 0.7 * weightGlenz;
      ctx.globalCompositeOperation = "screen";
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255, 255, 255, ${resolved.edgeAlpha * edgeWeight})`;
      const edgeOrder = this.faceOrder;
      edgeOrder.forEach((faceIndex) => {
        const faceBase = faceIndex * 3;
        const i0 = faces[faceBase];
        const i1 = faces[faceBase + 1];
        const i2 = faces[faceBase + 2];
        drawTriangle(i0, i1, i2);
        ctx.stroke();
      });
    }

    ctx.globalCompositeOperation = "source-over";
  }
}
