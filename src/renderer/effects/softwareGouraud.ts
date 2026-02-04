import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type SoftwareGouraudModel = "torus" | "sphere";

type SoftwareGouraudShading = "gouraud" | "phong";

type Mesh = {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint16Array | Uint32Array;
  count: number;
};

type BufferState = {
  width: number;
  height: number;
  color: Uint8ClampedArray;
  zbuf: Float32Array;
  imageData: ImageData;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
};

type MeshState = {
  mesh: Mesh;
  key: string;
};

export const SOFTWARE_GOURAUD_DEFAULTS = {
  bufW: 240,
  bufH: 180,
  model: "torus" as SoftwareGouraudModel,
  segmentsU: 48,
  segmentsV: 24,
  camDist: 3.2,
  focalMul: 1.2,
  rotXSpeed: 0.4,
  rotYSpeed: 0.7,
  rotZSpeed: 0.2,
  shading: "gouraud" as SoftwareGouraudShading,
  ambient: 0.2,
  diffuse: 0.95,
  specStrength: 0.35,
  shininess: 24,
  hueSpeed: 18,
  rimStrength: 0.2,
  wireframeOverlay: false,
  audioReact: 0.7,
  beatKick: 0.7,
  seed: 0
};

export type SoftwareGouraudParams = {
  bufW: number;
  bufH: number;
  model: SoftwareGouraudModel;
  segmentsU: number;
  segmentsV: number;
  camDist: number;
  focalMul: number;
  rotXSpeed: number;
  rotYSpeed: number;
  rotZSpeed: number;
  shading: SoftwareGouraudShading;
  ambient: number;
  diffuse: number;
  specStrength: number;
  shininess: number;
  hueSpeed: number;
  rimStrength: number;
  wireframeOverlay: boolean;
  audioReact: number;
  beatKick: number;
  seed: number;
};

type RGB = { r: number; g: number; b: number };

const TAU = Math.PI * 2;

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

const resolveModel = (value: unknown): SoftwareGouraudModel => {
  if (value === "sphere" || value === "torus") {
    return value;
  }
  return SOFTWARE_GOURAUD_DEFAULTS.model;
};

const resolveShading = (value: unknown): SoftwareGouraudShading => {
  if (value === "phong" || value === "gouraud") {
    return value;
  }
  return SOFTWARE_GOURAUD_DEFAULTS.shading;
};

const clamp01 = (value: number): number => clamp(value, 0, 1);

export const normalizeSoftwareGouraudParams = (params: Record<string, unknown>): SoftwareGouraudParams => ({
  bufW: clamp(Math.round(toNumber(params.bufW, SOFTWARE_GOURAUD_DEFAULTS.bufW)), 100, 480),
  bufH: clamp(Math.round(toNumber(params.bufH, SOFTWARE_GOURAUD_DEFAULTS.bufH)), 80, 360),
  model: resolveModel(params.model),
  segmentsU: clamp(Math.round(toNumber(params.segmentsU, SOFTWARE_GOURAUD_DEFAULTS.segmentsU)), 12, 128),
  segmentsV: clamp(Math.round(toNumber(params.segmentsV, SOFTWARE_GOURAUD_DEFAULTS.segmentsV)), 8, 96),
  camDist: clamp(toNumber(params.camDist, SOFTWARE_GOURAUD_DEFAULTS.camDist), 2, 6.5),
  focalMul: clamp(toNumber(params.focalMul, SOFTWARE_GOURAUD_DEFAULTS.focalMul), 0.6, 2.2),
  rotXSpeed: clamp(toNumber(params.rotXSpeed, SOFTWARE_GOURAUD_DEFAULTS.rotXSpeed), 0, 2.5),
  rotYSpeed: clamp(toNumber(params.rotYSpeed, SOFTWARE_GOURAUD_DEFAULTS.rotYSpeed), 0, 2.5),
  rotZSpeed: clamp(toNumber(params.rotZSpeed, SOFTWARE_GOURAUD_DEFAULTS.rotZSpeed), 0, 2.5),
  shading: resolveShading(params.shading),
  ambient: clamp01(toNumber(params.ambient, SOFTWARE_GOURAUD_DEFAULTS.ambient)),
  diffuse: clamp(toNumber(params.diffuse, SOFTWARE_GOURAUD_DEFAULTS.diffuse), 0, 1.5),
  specStrength: clamp01(toNumber(params.specStrength, SOFTWARE_GOURAUD_DEFAULTS.specStrength)),
  shininess: clamp(toNumber(params.shininess, SOFTWARE_GOURAUD_DEFAULTS.shininess), 2, 64),
  hueSpeed: clamp(toNumber(params.hueSpeed, SOFTWARE_GOURAUD_DEFAULTS.hueSpeed), 0, 80),
  rimStrength: clamp01(toNumber(params.rimStrength, SOFTWARE_GOURAUD_DEFAULTS.rimStrength)),
  wireframeOverlay: toToggle(params.wireframeOverlay, SOFTWARE_GOURAUD_DEFAULTS.wireframeOverlay),
  audioReact: clamp01(toNumber(params.audioReact, SOFTWARE_GOURAUD_DEFAULTS.audioReact)),
  beatKick: clamp01(toNumber(params.beatKick, SOFTWARE_GOURAUD_DEFAULTS.beatKick)),
  seed: Math.round(toNumber(params.seed, SOFTWARE_GOURAUD_DEFAULTS.seed))
});

const hslToRgb = (h: number, s: number, l: number, out: RGB): void => {
  const hue = ((h % 1) + 1) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue2rgb = (t: number): number => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  out.r = Math.round(hue2rgb(hue + 1 / 3) * 255);
  out.g = Math.round(hue2rgb(hue) * 255);
  out.b = Math.round(hue2rgb(hue - 1 / 3) * 255);
};

const buildTorus = (segmentsU: number, segmentsV: number): Mesh => {
  const majorRadius = 1.0;
  const minorRadius = 0.4;
  const count = segmentsU * segmentsV;
  const vertices = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  let offset = 0;
  for (let v = 0; v < segmentsV; v += 1) {
    const vAngle = (v / segmentsV) * TAU;
    const cosV = Math.cos(vAngle);
    const sinV = Math.sin(vAngle);
    for (let u = 0; u < segmentsU; u += 1) {
      const uAngle = (u / segmentsU) * TAU;
      const cosU = Math.cos(uAngle);
      const sinU = Math.sin(uAngle);
      const radius = majorRadius + minorRadius * cosV;
      vertices[offset] = radius * cosU;
      vertices[offset + 1] = radius * sinU;
      vertices[offset + 2] = minorRadius * sinV;
      normals[offset] = cosV * cosU;
      normals[offset + 1] = cosV * sinU;
      normals[offset + 2] = sinV;
      offset += 3;
    }
  }

  const indices: number[] = [];
  for (let v = 0; v < segmentsV; v += 1) {
    const nextV = (v + 1) % segmentsV;
    for (let u = 0; u < segmentsU; u += 1) {
      const nextU = (u + 1) % segmentsU;
      const a = v * segmentsU + u;
      const b = v * segmentsU + nextU;
      const c = nextV * segmentsU + u;
      const d = nextV * segmentsU + nextU;
      indices.push(a, c, b, b, c, d);
    }
  }

  const indexArray = count > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
  return { vertices, normals, indices: indexArray, count };
};

const buildSphere = (segmentsU: number, segmentsV: number): Mesh => {
  const rows = segmentsV + 1;
  const count = segmentsU * rows;
  const vertices = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  let offset = 0;
  for (let v = 0; v < rows; v += 1) {
    const theta = (v / segmentsV) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let u = 0; u < segmentsU; u += 1) {
      const phi = (u / segmentsU) * TAU;
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);
      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;
      vertices[offset] = x;
      vertices[offset + 1] = y;
      vertices[offset + 2] = z;
      normals[offset] = x;
      normals[offset + 1] = y;
      normals[offset + 2] = z;
      offset += 3;
    }
  }

  const indices: number[] = [];
  for (let v = 0; v < segmentsV; v += 1) {
    const nextV = v + 1;
    for (let u = 0; u < segmentsU; u += 1) {
      const nextU = (u + 1) % segmentsU;
      const a = v * segmentsU + u;
      const b = v * segmentsU + nextU;
      const c = nextV * segmentsU + u;
      const d = nextV * segmentsU + nextU;
      indices.push(a, c, b, b, c, d);
    }
  }

  const indexArray = count > 65535 ? new Uint32Array(indices) : new Uint16Array(indices);
  return { vertices, normals, indices: indexArray, count };
};

const ensureBuffer = (state: BufferState | null, width: number, height: number): BufferState => {
  if (state && state.width === width && state.height === height) {
    return state;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create software Gouraud buffer context");
  }
  const color = new Uint8ClampedArray(width * height * 4);
  const zbuf = new Float32Array(width * height);
  const imageData = new ImageData(color, width, height);
  return {
    width,
    height,
    color,
    zbuf,
    imageData,
    canvas,
    ctx
  };
};

const ensureMesh = (state: MeshState | null, params: SoftwareGouraudParams): MeshState => {
  const key = `${params.model}-${params.segmentsU}-${params.segmentsV}`;
  if (state && state.key === key) {
    return state;
  }
  const mesh = params.model === "sphere" ? buildSphere(params.segmentsU, params.segmentsV) : buildTorus(params.segmentsU, params.segmentsV);
  return { mesh, key };
};

const normalizeInPlace = (x: number, y: number, z: number): [number, number, number] => {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
};

export class SoftwareGouraudEffect implements Effect {
  private buffer: BufferState | null = null;
  private meshState: MeshState | null = null;
  private screenX = new Float32Array(0);
  private screenY = new Float32Array(0);
  private invZ = new Float32Array(0);
  private intensity = new Float32Array(0);
  private intensityOverZ = new Float32Array(0);
  private normalsView = new Float32Array(0);
  private lastTime = 0;
  private beatPulse = 0;

  reset(): void {
    this.lastTime = 0;
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const settings = normalizeSoftwareGouraudParams(params as Record<string, unknown>);
    this.meshState = ensureMesh(this.meshState, settings);
    const mesh = this.meshState.mesh;

    this.buffer = ensureBuffer(this.buffer, settings.bufW, settings.bufH);
    const { color, zbuf, imageData, canvas: bufCanvas, ctx: bufCtx } = this.buffer;

    if (this.screenX.length !== mesh.count) {
      this.screenX = new Float32Array(mesh.count);
      this.screenY = new Float32Array(mesh.count);
      this.invZ = new Float32Array(mesh.count);
      this.intensity = new Float32Array(mesh.count);
      this.intensityOverZ = new Float32Array(mesh.count);
      this.normalsView = new Float32Array(mesh.count * 3);
    }

    const dt = clamp(time - this.lastTime, 0, 0.05);
    this.lastTime = time;
    if (audio.beat) {
      this.beatPulse = 1;
    } else {
      this.beatPulse = Math.max(0, this.beatPulse - dt * 6);
    }

    const audioBoost = 1 + audio.bass * settings.audioReact * 0.65;
    const beatBoost = 1 + this.beatPulse * settings.beatKick * 0.25;
    const focal = Math.min(settings.bufW, settings.bufH) * settings.focalMul * (1 + settings.audioReact * audio.bass * 0.15);

    const ax = time * settings.rotXSpeed * audioBoost;
    const ay = time * settings.rotYSpeed * audioBoost;
    const az = time * settings.rotZSpeed * (audioBoost * 0.9 + this.beatPulse * 0.1);

    const cosX = Math.cos(ax);
    const sinX = Math.sin(ax);
    const cosY = Math.cos(ay);
    const sinY = Math.sin(ay);
    const cosZ = Math.cos(az);
    const sinZ = Math.sin(az);

    const cx = settings.bufW * 0.5;
    const cy = settings.bufH * 0.5;

    const lightDir = normalizeInPlace(0.3, 0.4, 1.0);

    const baseHue = ((time * settings.hueSpeed + 200) % 360) / 360;
    const baseRgb: RGB = { r: 0, g: 0, b: 0 };
    hslToRgb(baseHue, 0.65, 0.52, baseRgb);

    zbuf.fill(Infinity);

    const gradientTop = { r: 6, g: 8, b: 16 };
    const gradientBottom = { r: 16, g: 20, b: 28 };
    for (let y = 0; y < settings.bufH; y += 1) {
      const t = settings.bufH > 1 ? y / (settings.bufH - 1) : 0;
      const r = Math.round(gradientTop.r + (gradientBottom.r - gradientTop.r) * t);
      const g = Math.round(gradientTop.g + (gradientBottom.g - gradientTop.g) * t);
      const b = Math.round(gradientTop.b + (gradientBottom.b - gradientTop.b) * t);
      let idx = y * settings.bufW * 4;
      for (let x = 0; x < settings.bufW; x += 1) {
        color[idx] = r;
        color[idx + 1] = g;
        color[idx + 2] = b;
        color[idx + 3] = 255;
        idx += 4;
      }
    }

    const normalsView = this.normalsView;

    for (let i = 0; i < mesh.count; i += 1) {
      const baseIndex = i * 3;
      const px = mesh.vertices[baseIndex];
      const py = mesh.vertices[baseIndex + 1];
      const pz = mesh.vertices[baseIndex + 2];
      let y1 = py * cosX - pz * sinX;
      let z1 = py * sinX + pz * cosX;
      let x1 = px * cosY + z1 * sinY;
      let z2 = -px * sinY + z1 * cosY;
      let x2 = x1 * cosZ - y1 * sinZ;
      let y2 = x1 * sinZ + y1 * cosZ;
      const z3 = z2 + settings.camDist;

      const nx = mesh.normals[baseIndex];
      const ny = mesh.normals[baseIndex + 1];
      const nz = mesh.normals[baseIndex + 2];
      let ny1 = ny * cosX - nz * sinX;
      let nz1 = ny * sinX + nz * cosX;
      let nx1 = nx * cosY + nz1 * sinY;
      let nz2 = -nx * sinY + nz1 * cosY;
      let nx2 = nx1 * cosZ - ny1 * sinZ;
      let ny2 = nx1 * sinZ + ny1 * cosZ;

      if (settings.shading === "phong") {
        normalsView[baseIndex] = nx2;
        normalsView[baseIndex + 1] = ny2;
        normalsView[baseIndex + 2] = nz2;
      }

      const invDepth = 1 / z3;
      this.invZ[i] = invDepth;
      this.screenX[i] = cx + x2 * invDepth * focal;
      this.screenY[i] = cy + y2 * invDepth * focal;

      const ndl = Math.max(0, nx2 * lightDir[0] + ny2 * lightDir[1] + nz2 * lightDir[2]);
      const rim = settings.rimStrength * Math.pow(1 - Math.max(0, nz2), 2);
      let intensity = settings.ambient + settings.diffuse * ndl * beatBoost + rim;
      if (settings.shading === "gouraud" && settings.specStrength > 0) {
        const spec = Math.pow(Math.max(0, nz2), settings.shininess) * settings.specStrength * 0.45;
        intensity += spec;
      }
      intensity = clamp01(intensity);
      this.intensity[i] = intensity;
      this.intensityOverZ[i] = intensity * invDepth;
    }

    const indices = mesh.indices;
    const bufW = settings.bufW;
    const bufH = settings.bufH;
    const baseR = baseRgb.r;
    const baseG = baseRgb.g;
    const baseB = baseRgb.b;
    const specStrength = settings.specStrength;
    const shininess = settings.shininess;
    const rimStrength = settings.rimStrength;

    for (let t = 0; t < indices.length; t += 3) {
      const i0 = indices[t];
      const i1 = indices[t + 1];
      const i2 = indices[t + 2];
      const x0 = this.screenX[i0];
      const y0 = this.screenY[i0];
      const x1 = this.screenX[i1];
      const y1 = this.screenY[i1];
      const x2 = this.screenX[i2];
      const y2 = this.screenY[i2];
      const area = (x1 - x0) * (y2 - y0) - (y1 - y0) * (x2 - x0);
      if (area <= 0) {
        continue;
      }

      const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
      const maxX = Math.min(bufW - 1, Math.ceil(Math.max(x0, x1, x2)));
      const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
      const maxY = Math.min(bufH - 1, Math.ceil(Math.max(y0, y1, y2)));
      if (minX > maxX || minY > maxY) {
        continue;
      }

      const invArea = 1 / area;
      const invZ0 = this.invZ[i0];
      const invZ1 = this.invZ[i1];
      const invZ2 = this.invZ[i2];
      const i0OverZ = this.intensityOverZ[i0];
      const i1OverZ = this.intensityOverZ[i1];
      const i2OverZ = this.intensityOverZ[i2];

      const n0x = normalsView[i0 * 3];
      const n0y = normalsView[i0 * 3 + 1];
      const n0z = normalsView[i0 * 3 + 2];
      const n1x = normalsView[i1 * 3];
      const n1y = normalsView[i1 * 3 + 1];
      const n1z = normalsView[i1 * 3 + 2];
      const n2x = normalsView[i2 * 3];
      const n2y = normalsView[i2 * 3 + 1];
      const n2z = normalsView[i2 * 3 + 2];

      for (let y = minY; y <= maxY; y += 1) {
        const py = y + 0.5;
        let idx = (y * bufW + minX) * 4;
        for (let x = minX; x <= maxX; x += 1) {
          const px = x + 0.5;
          const w0 = ((px - x1) * (y2 - y1) - (py - y1) * (x2 - x1)) * invArea;
          if (w0 < 0) {
            idx += 4;
            continue;
          }
          const w1 = ((px - x2) * (y0 - y2) - (py - y2) * (x0 - x2)) * invArea;
          if (w1 < 0) {
            idx += 4;
            continue;
          }
          const w2 = 1 - w0 - w1;
          if (w2 < 0) {
            idx += 4;
            continue;
          }

          const invZ = w0 * invZ0 + w1 * invZ1 + w2 * invZ2;
          const z = 1 / invZ;
          const zIndex = y * bufW + x;
          if (z >= zbuf[zIndex]) {
            idx += 4;
            continue;
          }
          zbuf[zIndex] = z;

          let light = 0;
          if (settings.shading === "gouraud") {
            light = (w0 * i0OverZ + w1 * i1OverZ + w2 * i2OverZ) / invZ;
          } else {
            let nx = w0 * n0x + w1 * n1x + w2 * n2x;
            let ny = w0 * n0y + w1 * n1y + w2 * n2y;
            let nz = w0 * n0z + w1 * n1z + w2 * n2z;
            const invLen = 1 / (Math.hypot(nx, ny, nz) || 1);
            nx *= invLen;
            ny *= invLen;
            nz *= invLen;
            const ndl = Math.max(0, nx * lightDir[0] + ny * lightDir[1] + nz * lightDir[2]);
            const spec = Math.pow(Math.max(0, nz), shininess) * specStrength;
            const rim = rimStrength * Math.pow(1 - Math.max(0, nz), 2);
            light = settings.ambient + settings.diffuse * ndl * beatBoost + spec + rim;
          }
          const intensity = clamp01(light);
          color[idx] = Math.round(baseR * intensity);
          color[idx + 1] = Math.round(baseG * intensity);
          color[idx + 2] = Math.round(baseB * intensity);
          color[idx + 3] = 255;
          idx += 4;
        }
      }
    }

    bufCtx.putImageData(imageData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(bufCanvas, 0, 0, settings.bufW, settings.bufH, 0, 0, width, height);

    if (settings.wireframeOverlay) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, 0.7)`;
      ctx.beginPath();
      const scaleX = width / settings.bufW;
      const scaleY = height / settings.bufH;
      const stride = Math.max(1, Math.floor(indices.length / 1200));
      for (let t = 0; t < indices.length; t += 3 * stride) {
        const i0 = indices[t];
        const i1 = indices[t + 1];
        const i2 = indices[t + 2];
        const x0 = this.screenX[i0] * scaleX;
        const y0 = this.screenY[i0] * scaleY;
        const x1 = this.screenX[i1] * scaleX;
        const y1 = this.screenY[i1] * scaleY;
        const x2 = this.screenX[i2] * scaleX;
        const y2 = this.screenY[i2] * scaleY;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x0, y0);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
