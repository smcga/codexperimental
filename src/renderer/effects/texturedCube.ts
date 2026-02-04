import { clamp } from "../../util/math";
import { PixelBuffer } from "./pixelBuffer";
import { Effect, EffectRenderContext } from "./types";

type Vec3 = {
  x: number;
  y: number;
  z: number;
};

type ProjectedVertex = {
  x: number;
  y: number;
  z: number;
  invZ: number;
};

type FaceDefinition = {
  indices: [number, number, number, number];
  texture: number;
};

type FaceTexture = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
};

type TextureAtlas = {
  textures: FaceTexture[];
  tick: number;
};

const CUBE_VERTICES: Vec3[] = [
  { x: -1, y: -1, z: -1 },
  { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 },
  { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 },
  { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 },
  { x: -1, y: 1, z: 1 }
];

const CUBE_FACES: FaceDefinition[] = [
  { indices: [0, 1, 2, 3], texture: 0 },
  { indices: [4, 5, 6, 7], texture: 1 },
  { indices: [0, 1, 5, 4], texture: 2 },
  { indices: [3, 2, 6, 7], texture: 3 },
  { indices: [0, 3, 7, 4], texture: 4 },
  { indices: [1, 2, 6, 5], texture: 5 }
];

const FACE_UVS: [number, number][] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
];

export const TEXTURED_CUBE_DEFAULTS = {
  scale: 3,
  camDist: 4.0,
  focalMul: 0.9,
  rotXSpeed: 0.5,
  rotYSpeed: 0.8,
  rotZSpeed: 0.15,
  backfaceCull: 1,
  perspectiveCorrect: 0,
  edge: 1,
  edgeAlpha: 0.25,
  shadeStrength: 0.55,
  audioReact: 0.7,
  beatKick: 0.7,
  textureAnim: 0
};

export function rotateVertex(vertex: Vec3, rotX: number, rotY: number, rotZ: number): Vec3 {
  let { x, y, z } = vertex;
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const cosZ = Math.cos(rotZ);
  const sinZ = Math.sin(rotZ);

  let nextY = y * cosX - z * sinX;
  let nextZ = y * sinX + z * cosX;
  y = nextY;
  z = nextZ;

  let nextX = x * cosY + z * sinY;
  nextZ = -x * sinY + z * cosY;
  x = nextX;
  z = nextZ;

  nextX = x * cosZ - y * sinZ;
  nextY = x * sinZ + y * cosZ;

  return { x: nextX, y: nextY, z };
}

export function projectVertex(
  vertex: Vec3,
  camDist: number,
  focal: number,
  cx: number,
  cy: number
): ProjectedVertex {
  const zCam = Math.max(0.1, vertex.z + camDist);
  const scale = focal / zCam;
  return {
    x: cx + vertex.x * scale,
    y: cy + vertex.y * scale,
    z: zCam,
    invZ: 1 / zCam
  };
}

const normalize = (vector: Vec3): Vec3 => {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length
  };
};

const LIGHT_DIR: Vec3 = normalize({ x: 0.3, y: -0.35, z: -0.9 });

const subtract = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z
});

const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x
});

const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;

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

const createTextureCanvas = (size: number): FaceTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create texture context");
  }
  ctx.imageSmoothingEnabled = false;
  return {
    canvas,
    ctx,
    pixels: new Uint8ClampedArray(size * size * 4),
    width: size,
    height: size
  };
};

const refreshTexturePixels = (texture: FaceTexture): void => {
  const imageData = texture.ctx.getImageData(0, 0, texture.width, texture.height);
  texture.pixels = imageData.data;
};

const drawLabel = (ctx: CanvasRenderingContext2D, text: string, size: number, color = "#fefefe"): void => {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 4;
  ctx.fillText(text, 32, 32);
  ctx.restore();
};

const drawCheckerTexture = (texture: FaceTexture): void => {
  const { ctx, width } = texture;
  const size = width / 8;
  ctx.fillStyle = "#1b1b1f";
  ctx.fillRect(0, 0, width, width);
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      const isLight = (x + y) % 2 === 0;
      ctx.fillStyle = isLight ? "#d8f2ff" : "#5877a6";
      ctx.fillRect(x * size, y * size, size, size);
    }
  }
  drawLabel(ctx, "A", 22);
  refreshTexturePixels(texture);
};

const drawStripeTexture = (texture: FaceTexture, phase: number): void => {
  const { ctx, width } = texture;
  ctx.fillStyle = "#0c0e16";
  ctx.fillRect(0, 0, width, width);
  ctx.save();
  ctx.translate(width * 0.5, width * 0.5);
  ctx.rotate(-Math.PI / 6);
  ctx.translate(-width * 0.5, -width * 0.5);
  for (let x = -width; x < width * 2; x += 6) {
    const offset = (phase * 8) % 12;
    ctx.fillStyle = "#d04d75";
    ctx.fillRect(x + offset, 0, 3, width);
  }
  ctx.restore();
  drawLabel(ctx, "B", 22, "#fdf7e2");
  refreshTexturePixels(texture);
};

const drawCopperTexture = (texture: FaceTexture, phase: number): void => {
  const { ctx, width } = texture;
  const grad = ctx.createLinearGradient(0, 0, width, width);
  grad.addColorStop(0, "#2b0e07");
  grad.addColorStop(0.4, "#a04a1c");
  grad.addColorStop(0.6, "#f3b36f");
  grad.addColorStop(1, "#6d2b10");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, width);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  for (let i = 0; i < 6; i += 1) {
    const y = ((i * 10 + phase * 6) % width);
    ctx.fillRect(0, y, width, 2);
  }
  refreshTexturePixels(texture);
};

const drawNoiseTexture = (texture: FaceTexture, seed: number): void => {
  const { ctx, width } = texture;
  const rand = mulberry32(seed);
  const imageData = ctx.createImageData(width, width);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const value = rand() > 0.5 ? 210 : 60;
    imageData.data[i] = value;
    imageData.data[i + 1] = value;
    imageData.data[i + 2] = value + 20;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  refreshTexturePixels(texture);
};

const drawPlasmaTexture = (texture: FaceTexture, phase: number): void => {
  const { ctx, width } = texture;
  const imageData = ctx.createImageData(width, width);
  for (let y = 0; y < width; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const value =
        Math.sin((x + phase * 20) * 0.15) +
        Math.sin((y - phase * 12) * 0.2) +
        Math.sin((x + y + phase * 8) * 0.1);
      const hue = (value * 0.5 + 0.5) * 280;
      const [r, g, b] = hslToRgb(hue, 0.75, 0.45);
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  refreshTexturePixels(texture);
};

const drawLogoTexture = (texture: FaceTexture): void => {
  const { ctx, width } = texture;
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, width, width);
  ctx.strokeStyle = "#27f3ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, width - 8, width - 8);
  ctx.fillStyle = "#27f3ff";
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SMCGA", width / 2, width / 2);
  refreshTexturePixels(texture);
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
};

const buildTextures = (size: number, phase: number): FaceTexture[] => {
  const textures = Array.from({ length: 6 }, () => createTextureCanvas(size));
  drawCheckerTexture(textures[0]);
  drawStripeTexture(textures[1], phase);
  drawCopperTexture(textures[2], phase);
  drawNoiseTexture(textures[3], Math.floor(phase * 100) + 3);
  drawPlasmaTexture(textures[4], phase);
  drawLogoTexture(textures[5]);
  return textures;
};

type RasterTriangleOptions = {
  perspectiveCorrect: boolean;
};

const rasterTriangle = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  u0: number,
  v0: number,
  x1: number,
  y1: number,
  u1: number,
  v1: number,
  x2: number,
  y2: number,
  u2: number,
  v2: number,
  texture: FaceTexture,
  shade: number,
  options: RasterTriangleOptions,
  invZ0 = 1,
  invZ1 = 1,
  invZ2 = 1
): void => {
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
  const maxX = Math.min(width - 1, Math.ceil(Math.max(x0, x1, x2)));
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(y0, y1, y2)));

  const area = edgeFunction(x0, y0, x1, y1, x2, y2);
  if (area === 0) {
    return;
  }
  const invArea = 1 / area;
  const texW = texture.width;
  const texH = texture.height;
  const texPixels = texture.pixels;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const w0 = edgeFunction(x1, y1, x2, y2, px, py);
      const w1 = edgeFunction(x2, y2, x0, y0, px, py);
      const w2 = edgeFunction(x0, y0, x1, y1, px, py);

      if ((area > 0 && (w0 < 0 || w1 < 0 || w2 < 0)) || (area < 0 && (w0 > 0 || w1 > 0 || w2 > 0))) {
        continue;
      }

      const b0 = w0 * invArea;
      const b1 = w1 * invArea;
      const b2 = w2 * invArea;

      let u: number;
      let v: number;

      if (options.perspectiveCorrect) {
        const invZ = b0 * invZ0 + b1 * invZ1 + b2 * invZ2;
        if (invZ === 0) {
          continue;
        }
        u = (b0 * u0 * invZ0 + b1 * u1 * invZ1 + b2 * u2 * invZ2) / invZ;
        v = (b0 * v0 * invZ0 + b1 * v1 * invZ1 + b2 * v2 * invZ2) / invZ;
      } else {
        u = b0 * u0 + b1 * u1 + b2 * u2;
        v = b0 * v0 + b1 * v1 + b2 * v2;
      }

      const texX = clamp(Math.floor(u * (texW - 1)), 0, texW - 1);
      const texY = clamp(Math.floor(v * (texH - 1)), 0, texH - 1);
      const texIndex = (texY * texW + texX) * 4;
      const r = texPixels[texIndex] * shade;
      const g = texPixels[texIndex + 1] * shade;
      const b = texPixels[texIndex + 2] * shade;
      const outIndex = (y * width + x) * 4;
      data[outIndex] = r;
      data[outIndex + 1] = g;
      data[outIndex + 2] = b;
      data[outIndex + 3] = 255;
    }
  }
};

const edgeFunction = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): number =>
  (x2 - x0) * (y1 - y0) - (y2 - y0) * (x1 - x0);

export class TexturedCubeEffect implements Effect {
  private textureAtlas: TextureAtlas | null = null;
  private renderTarget: PixelBuffer | null = null;
  private beatPulse = 0;

  render({ ctx, width, height, time, delta, audio, params }: EffectRenderContext): void {
    const scale = clamp(Math.round(params.scale ?? TEXTURED_CUBE_DEFAULTS.scale), 1, 6);
    const camDist = params.camDist ?? TEXTURED_CUBE_DEFAULTS.camDist;
    const focalMul = params.focalMul ?? TEXTURED_CUBE_DEFAULTS.focalMul;
    const rotXSpeed = params.rotXSpeed ?? TEXTURED_CUBE_DEFAULTS.rotXSpeed;
    const rotYSpeed = params.rotYSpeed ?? TEXTURED_CUBE_DEFAULTS.rotYSpeed;
    const rotZSpeed = params.rotZSpeed ?? TEXTURED_CUBE_DEFAULTS.rotZSpeed;
    const backfaceCull = (params.backfaceCull ?? TEXTURED_CUBE_DEFAULTS.backfaceCull) > 0.5;
    const perspectiveCorrect = (params.perspectiveCorrect ?? TEXTURED_CUBE_DEFAULTS.perspectiveCorrect) > 0.5;
    const edge = (params.edge ?? TEXTURED_CUBE_DEFAULTS.edge) > 0.5;
    const edgeAlpha = params.edgeAlpha ?? TEXTURED_CUBE_DEFAULTS.edgeAlpha;
    const shadeStrength = params.shadeStrength ?? TEXTURED_CUBE_DEFAULTS.shadeStrength;
    const audioReact = params.audioReact ?? TEXTURED_CUBE_DEFAULTS.audioReact;
    const beatKick = params.beatKick ?? TEXTURED_CUBE_DEFAULTS.beatKick;
    const textureAnim = (params.textureAnim ?? TEXTURED_CUBE_DEFAULTS.textureAnim) > 0.5;

    const targetWidth = Math.max(1, Math.floor(width / scale));
    const targetHeight = Math.max(1, Math.floor(height / scale));

    if (!this.renderTarget || this.renderTarget.width !== targetWidth || this.renderTarget.height !== targetHeight) {
      this.renderTarget = new PixelBuffer(targetWidth, targetHeight);
    }

    const textureTick = textureAnim ? Math.floor(time * 2) : 0;
    if (!this.textureAtlas || this.textureAtlas.tick !== textureTick) {
      this.textureAtlas = {
        textures: buildTextures(64, time),
        tick: textureTick
      };
    }

    const audioBoost = 1 + audio.bass * audioReact * 0.6;
    this.beatPulse = Math.max(0, this.beatPulse - delta * 6);
    if (audio.beat) {
      this.beatPulse = 1;
    }
    const beatBoost = 1 + beatKick * 0.7 * this.beatPulse;
    const rotationBoost = audioBoost * beatBoost;
    const shadeBoost = 1 + beatKick * 0.25 * this.beatPulse;

    const rotX = time * rotXSpeed * rotationBoost;
    const rotY = time * rotYSpeed * rotationBoost;
    const rotZ = time * rotZSpeed * rotationBoost;

    const rotatedVertices = CUBE_VERTICES.map((vertex) => rotateVertex(vertex, rotX, rotY, rotZ));

    const cx = width / 2;
    const cy = height / 2;
    const focal = Math.min(width, height) * focalMul;
    const projected = rotatedVertices.map((vertex) => projectVertex(vertex, camDist, focal, cx, cy));

    const faceList = CUBE_FACES.map((face) => {
      const v0 = rotatedVertices[face.indices[0]];
      const v1 = rotatedVertices[face.indices[1]];
      const v2 = rotatedVertices[face.indices[2]];
      const v3 = rotatedVertices[face.indices[3]];
      const normal = normalize(cross(subtract(v1, v0), subtract(v2, v0)));
      const facing = dot(normal, { x: 0, y: 0, z: 1 }) < 0;
      const depth = (projected[face.indices[0]].z + projected[face.indices[1]].z + projected[face.indices[2]].z + projected[face.indices[3]].z) / 4;

      return {
        face,
        normal,
        depth,
        facing,
        projected: [
          projected[face.indices[0]],
          projected[face.indices[1]],
          projected[face.indices[2]],
          projected[face.indices[3]]
        ]
      };
    })
      .filter((entry) => !backfaceCull || entry.facing)
      .sort((a, b) => b.depth - a.depth);

    const data = this.renderTarget.imageData.data;
    data.fill(0);

    const textureOptions: RasterTriangleOptions = { perspectiveCorrect };
    const atlas = this.textureAtlas.textures;
    const invScale = 1 / scale;

    faceList.forEach((entry) => {
      const texture = atlas[entry.face.texture];
      const light = clamp(0.55 + dot(entry.normal, LIGHT_DIR) * shadeStrength, 0.15, 1.1) * shadeBoost;

      const [p0, p1, p2, p3] = entry.projected;
      const x0 = p0.x * invScale;
      const y0 = p0.y * invScale;
      const x1 = p1.x * invScale;
      const y1 = p1.y * invScale;
      const x2 = p2.x * invScale;
      const y2 = p2.y * invScale;
      const x3 = p3.x * invScale;
      const y3 = p3.y * invScale;

      const [u0, v0] = FACE_UVS[0];
      const [u1, v1] = FACE_UVS[1];
      const [u2, v2] = FACE_UVS[2];
      const [u3, v3] = FACE_UVS[3];

      rasterTriangle(
        data,
        targetWidth,
        targetHeight,
        x0,
        y0,
        u0,
        v0,
        x1,
        y1,
        u1,
        v1,
        x2,
        y2,
        u2,
        v2,
        texture,
        light,
        textureOptions,
        p0.invZ,
        p1.invZ,
        p2.invZ
      );
      rasterTriangle(
        data,
        targetWidth,
        targetHeight,
        x0,
        y0,
        u0,
        v0,
        x2,
        y2,
        u2,
        v2,
        x3,
        y3,
        u3,
        v3,
        texture,
        light,
        textureOptions,
        p0.invZ,
        p2.invZ,
        p3.invZ
      );
    });

    this.renderTarget.commit();

    ctx.save();
    ctx.fillStyle = "#05060a";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.renderTarget.canvas, 0, 0, targetWidth, targetHeight, 0, 0, width, height);

    if (edge) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,255,255,${clamp(edgeAlpha, 0, 1)})`;
      ctx.lineWidth = 1;

      faceList.forEach((entry) => {
        const [p0, p1, p2, p3] = entry.projected;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.stroke();
      });
      ctx.restore();
    }

    ctx.restore();
  }

  reset(): void {
    this.textureAtlas = null;
    this.renderTarget = null;
    this.beatPulse = 0;
  }
}
