import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const GRID_SIZE = 64;
const INSTANCE_COUNT = GRID_SIZE * GRID_SIZE;
const BASE_CAMERA_PITCH = (25 * Math.PI) / 180;

export const VOXEL_WORLD_BUILDER_DEFAULTS = {
  buildProgress: 0,
  cityDensity: 0.62,
  glow: 0.85,
  cameraLift: 0.15,
  seed: 11
};

export type VoxelWorldBuilderParams = {
  buildProgress: number;
  cityDensity: number;
  glow: number;
  cameraLift: number;
  seed: number;
};

export type VoxelWorldLayout = {
  offsets: Float32Array;
  terrainHeights: Float32Array;
  buildingHeights: Float32Array;
  emissiveSeeds: Float32Array;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const hash2D = (x: number, z: number, seed: number): number => {
  let n = Math.imul(x + 101, 374761393) ^ Math.imul(z + 53, 668265263) ^ Math.imul(seed + 7, 2147483647);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return (n ^ (n >>> 16)) / 4294967295;
};

const smoothStep = (edge0: number, edge1: number, value: number): number => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

export const voxelBuildPhases = (buildProgress: number): { terrain: number; buildings: number; glowBoost: number } => {
  const terrain = smoothStep(0, 0.4, buildProgress);
  const buildings = smoothStep(0.4, 0.8, buildProgress);
  const glowBoost = smoothStep(0.8, 1.0, buildProgress);
  return { terrain, buildings, glowBoost };
};

export function normalizeVoxelWorldBuilderParams(params: Record<string, number>): VoxelWorldBuilderParams {
  return {
    buildProgress: clamp(toFiniteNumber(params.buildProgress, VOXEL_WORLD_BUILDER_DEFAULTS.buildProgress), 0, 1),
    cityDensity: clamp(toFiniteNumber(params.cityDensity, VOXEL_WORLD_BUILDER_DEFAULTS.cityDensity), 0, 1),
    glow: clamp(toFiniteNumber(params.glow, VOXEL_WORLD_BUILDER_DEFAULTS.glow), 0, 2),
    cameraLift: clamp(toFiniteNumber(params.cameraLift, VOXEL_WORLD_BUILDER_DEFAULTS.cameraLift), -0.25, 1.5),
    seed: toFiniteNumber(params.seed, VOXEL_WORLD_BUILDER_DEFAULTS.seed)
  };
}

export function createVoxelWorldLayout(gridSize: number, cityDensity: number, seed: number): VoxelWorldLayout {
  const offsets = new Float32Array(gridSize * gridSize * 2);
  const terrainHeights = new Float32Array(gridSize * gridSize);
  const buildingHeights = new Float32Array(gridSize * gridSize);
  const emissiveSeeds = new Float32Array(gridSize * gridSize);
  const half = (gridSize - 1) * 0.5;

  for (let z = 0; z < gridSize; z += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const idx = z * gridSize + x;
      const offsetIndex = idx * 2;
      offsets[offsetIndex] = x - half;
      offsets[offsetIndex + 1] = z - half;

      const terrainWave =
        Math.sin((x + seed * 0.17) * 0.16) * 0.5 +
        Math.cos((z - seed * 0.13) * 0.18) * 0.34 +
        Math.sin((x + z) * 0.075 + seed * 0.2) * 0.22;
      const terrainNoise = hash2D(x, z, seed) * 0.4;
      const terrainLevel = clamp((terrainWave * 0.5 + 0.5) * 0.72 + terrainNoise * 0.28, 0, 1);
      terrainHeights[idx] = lerp(0.15, 5.8, terrainLevel);

      const blockX = Math.floor(x / 8);
      const blockZ = Math.floor(z / 8);
      const avenue = x % 8 === 0 || z % 8 === 0;
      const dx = (x - half) / half;
      const dz = (z - half) / half;
      const radial = clamp(1 - Math.sqrt(dx * dx + dz * dz), 0, 1);
      const district = Math.sin(blockX * 1.7 + seed * 0.9) * Math.cos(blockZ * 1.9 - seed * 0.4);
      const districtBias = district * 0.25 + 0.25;
      const random = hash2D(blockX * 19 + x, blockZ * 23 + z, seed + 71);
      const threshold = 0.92 - cityDensity * 0.56 - radial * 0.34 - districtBias * 0.12;
      const isBuilding = !avenue && random > threshold;

      if (isBuilding) {
        const towerBand = 0.4 + radial * 0.6;
        const towerNoise = hash2D(x * 3 + blockX, z * 5 + blockZ, seed + 997);
        const base = lerp(4, 16, towerBand);
        const tier = Math.floor((towerNoise * 3 + radial * 2.5) % 4);
        buildingHeights[idx] = base + tier * 4 + towerNoise * 6;
      } else {
        buildingHeights[idx] = 0;
      }

      emissiveSeeds[idx] = hash2D(x * 13, z * 17, seed + 191);
    }
  }

  return { offsets, terrainHeights, buildingHeights, emissiveSeeds };
}

export const computeVoxelColumnHeight = (
  terrainHeight: number,
  buildingHeight: number,
  buildProgress: number
): number => {
  const phases = voxelBuildPhases(buildProgress);
  return terrainHeight * phases.terrain + buildingHeight * phases.buildings;
};

const VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_offset;
layout(location = 3) in float a_terrainHeight;
layout(location = 4) in float a_buildingHeight;
layout(location = 5) in float a_seed;

uniform mat4 u_viewProj;
uniform float u_buildProgress;
uniform float u_time;

out vec3 v_normal;
out vec3 v_worldPos;
out float v_height;
out float v_buildingHeight;
out float v_seed;

float smoothRange(float a, float b, float t) {
  float x = clamp((t - a) / max(0.0001, (b - a)), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

void main() {
  float terrainPhase = smoothRange(0.0, 0.4, u_buildProgress);
  float buildingPhase = smoothRange(0.4, 0.8, u_buildProgress);
  float h = a_terrainHeight * terrainPhase + a_buildingHeight * buildingPhase;

  vec3 scaled = vec3(a_position.x, a_position.y * h, a_position.z);
  vec3 world = vec3(a_offset.x, 0.0, a_offset.y) + scaled;

  v_worldPos = world;
  v_normal = normalize(vec3(a_normal.x, a_normal.y / max(0.35, h), a_normal.z));
  v_height = h;
  v_buildingHeight = a_buildingHeight;
  v_seed = a_seed + fract(u_time * 0.01);

  gl_Position = u_viewProj * vec4(world, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_worldPos;
in float v_height;
in float v_buildingHeight;
in float v_seed;

uniform float u_time;
uniform float u_buildProgress;
uniform float u_glow;
out vec4 outColor;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float smoothRange(float a, float b, float t) {
  float x = clamp((t - a) / max(0.0001, (b - a)), 0.0, 1.0);
  return x * x * (3.0 - 2.0 * x);
}

void main() {
  vec3 darkBase = vec3(0.043, 0.058, 0.078);
  vec3 cyan = vec3(0.16, 0.78, 0.88);
  vec3 teal = vec3(0.05, 0.45, 0.52);
  vec3 warm = vec3(1.0, 0.73, 0.42);

  vec3 lightDir = normalize(vec3(-0.6, 0.9, -0.45));
  float diffuse = max(dot(normalize(v_normal), lightDir), 0.0);
  float rim = pow(1.0 - max(v_normal.y, 0.0), 1.7);

  float terrainMix = clamp(v_height / 8.0, 0.0, 1.0);
  vec3 base = mix(darkBase, teal, terrainMix);

  float buildingMix = smoothstep(2.0, 10.0, v_buildingHeight);
  base = mix(base, cyan, buildingMix * 0.6);

  float glowPhase = smoothRange(0.8, 1.0, u_buildProgress);
  float windowMask = step(0.7, hash12(floor(v_worldPos.xz * 0.75) + floor(v_worldPos.y * 0.6 + v_seed * 17.0)));
  float flicker = 0.55 + 0.45 * sin(u_time * 10.5 + v_seed * 19.0 + v_worldPos.y * 0.22);
  float windows = windowMask * flicker * glowPhase * smoothstep(4.0, 18.0, v_buildingHeight);

  float emissive = (rim * 0.35 + buildingMix * 0.25) * u_glow;
  vec3 color = base * (0.45 + diffuse * 0.7) + cyan * emissive + warm * windows;

  outColor = vec4(color, 1.0);
}
`;

const mat4Perspective = (fovY: number, aspect: number, near: number, far: number): Float32Array => {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
};

const mat4LookAt = (
  eyeX: number,
  eyeY: number,
  eyeZ: number,
  targetX: number,
  targetY: number,
  targetZ: number
): Float32Array => {
  let z0 = eyeX - targetX;
  let z1 = eyeY - targetY;
  let z2 = eyeZ - targetZ;
  let len = Math.hypot(z0, z1, z2) || 1;
  z0 /= len;
  z1 /= len;
  z2 /= len;

  let x0 = z2;
  let x1 = 0;
  let x2 = -z0;
  len = Math.hypot(x0, x1, x2);
  if (len < 0.0001) {
    x0 = 1;
    x1 = 0;
    x2 = 0;
    len = 1;
  }
  x0 /= len;
  x1 /= len;
  x2 /= len;

  const y0 = z1 * x2 - z2 * x1;
  const y1 = z2 * x0 - z0 * x2;
  const y2 = z0 * x1 - z1 * x0;

  return new Float32Array([
    x0, y0, z0, 0,
    x1, y1, z1, 0,
    x2, y2, z2, 0,
    -(x0 * eyeX + x1 * eyeY + x2 * eyeZ),
    -(y0 * eyeX + y1 * eyeY + y2 * eyeZ),
    -(z0 * eyeX + z1 * eyeY + z2 * eyeZ),
    1
  ]);
};

const mat4Multiply = (a: Float32Array, b: Float32Array): Float32Array => {
  const out = new Float32Array(16);
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

  return out;
};

const buildCubeGeometry = (): { positions: Float32Array; normals: Float32Array; indices: Uint16Array } => {
  const positions = new Float32Array([
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 1, -0.5, -0.5, 1, -0.5,
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0.5, -0.5, 1, 0.5,
    -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0.5, -0.5, 1, -0.5,
    0.5, 0, -0.5, 0.5, 0, 0.5, 0.5, 1, 0.5, 0.5, 1, -0.5,
    -0.5, 1, -0.5, 0.5, 1, -0.5, 0.5, 1, 0.5, -0.5, 1, 0.5,
    -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5
  ]);
  const normals = new Float32Array([
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    8, 9, 10, 8, 10, 11,
    12, 14, 13, 12, 15, 14,
    16, 17, 18, 16, 18, 19,
    20, 22, 21, 20, 23, 22
  ]);
  return { positions, normals, indices };
};

class WebGLVoxelWorldRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private indexCount = 0;
  private warned = false;
  private lastSize = { width: 0, height: 0 };

  constructor(private layout: VoxelWorldLayout) {
    this.canvas = document.createElement("canvas");
    this.gl = this.canvas.getContext("webgl2", { antialias: false, depth: true });
    this.initialize(layout);
  }

  get available(): boolean {
    return Boolean(this.gl && this.program && this.vao);
  }

  render(context: EffectRenderContext, params: VoxelWorldBuilderParams): boolean {
    if (!this.gl || !this.program || !this.vao) {
      return false;
    }

    const gl = this.gl;
    if (this.lastSize.width !== context.width || this.lastSize.height !== context.height) {
      this.lastSize = { width: context.width, height: context.height };
      this.canvas.width = Math.max(1, context.width);
      this.canvas.height = Math.max(1, context.height);
    }

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.043, 0.058, 0.078, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const orbit = context.time * 0.16;
    const radius = GRID_SIZE * 0.88;
    const lift = 10 + params.cameraLift * 22 + params.buildProgress * 9;
    const eyeX = Math.cos(orbit) * radius;
    const eyeZ = Math.sin(orbit) * radius;
    const eyeY = lift;

    const targetX = 0;
    const targetZ = 0;
    const targetY = 6 + params.buildProgress * 5 + Math.tan(BASE_CAMERA_PITCH) * 3;

    const view = mat4LookAt(eyeX, eyeY, eyeZ, targetX, targetY, targetZ);
    const proj = mat4Perspective((54 * Math.PI) / 180, context.width / Math.max(1, context.height), 0.1, 420);
    const viewProj = mat4Multiply(proj, view);

    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    const uViewProj = gl.getUniformLocation(this.program, "u_viewProj");
    const uTime = gl.getUniformLocation(this.program, "u_time");
    const uProgress = gl.getUniformLocation(this.program, "u_buildProgress");
    const uGlow = gl.getUniformLocation(this.program, "u_glow");

    if (uViewProj) gl.uniformMatrix4fv(uViewProj, false, viewProj);
    if (uTime) gl.uniform1f(uTime, context.time);
    if (uProgress) gl.uniform1f(uProgress, params.buildProgress);
    if (uGlow) gl.uniform1f(uGlow, params.glow + context.audio.treble * 0.35);

    gl.drawElementsInstanced(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0, this.layout.terrainHeights.length);

    context.ctx.drawImage(this.canvas, 0, 0, context.width, context.height);
    return true;
  }

  private initialize(layout: VoxelWorldLayout): void {
    const gl = this.gl;
    if (!gl) {
      return;
    }

    const program = this.createProgram(VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) {
      return;
    }

    this.program = program;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const geometry = buildCubeGeometry();
    this.indexCount = geometry.indices.length;

    const posBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const offsetBuffer = gl.createBuffer();
    const terrainBuffer = gl.createBuffer();
    const buildingBuffer = gl.createBuffer();
    const emissiveBuffer = gl.createBuffer();

    if (
      !posBuffer ||
      !normalBuffer ||
      !indexBuffer ||
      !offsetBuffer ||
      !terrainBuffer ||
      !buildingBuffer ||
      !emissiveBuffer
    ) {
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, offsetBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, layout.offsets, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, terrainBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, layout.terrainHeights, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(3, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, buildingBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, layout.buildingHeights, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(4, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, emissiveBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, layout.emissiveSeeds, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(5, 1);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
  }

  private createProgram(vsSource: string, fsSource: string): WebGLProgram | null {
    const gl = this.gl;
    if (!gl) {
      return null;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) {
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        if (!this.warned) {
          console.warn("[voxel_world_builder] Shader compile failed", gl.getShaderInfoLog(shader));
          this.warned = true;
        }
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      return null;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (!this.warned) {
        console.warn("[voxel_world_builder] Program link failed", gl.getProgramInfoLog(program));
        this.warned = true;
      }
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }
}

const drawVoxelFallback2D = (context: EffectRenderContext, layout: VoxelWorldLayout, params: VoxelWorldBuilderParams): void => {
  const { ctx, width, height, time } = context;
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, width, height);

  const phases = voxelBuildPhases(params.buildProgress);
  const scale = Math.min(width, height) / (GRID_SIZE * 0.9);
  const centreX = width * 0.5;
  const centreY = height * 0.64 - params.cameraLift * 25;
  const orbit = time * 0.15;
  const cosA = Math.cos(orbit);
  const sinA = Math.sin(orbit);

  type Cell = { sx: number; sy: number; h: number; depth: number; building: number; seed: number };
  const cells: Cell[] = [];

  for (let i = 0; i < INSTANCE_COUNT; i += 1) {
    const ox = layout.offsets[i * 2];
    const oz = layout.offsets[i * 2 + 1];
    const rx = ox * cosA - oz * sinA;
    const rz = ox * sinA + oz * cosA;
    const heightValue = computeVoxelColumnHeight(layout.terrainHeights[i], layout.buildingHeights[i], params.buildProgress);
    cells.push({ sx: centreX + (rx - rz) * scale * 0.9, sy: centreY + (rx + rz) * scale * 0.45, h: heightValue, depth: rx + rz, building: layout.buildingHeights[i], seed: layout.emissiveSeeds[i] });
  }

  cells.sort((a, b) => a.depth - b.depth);

  for (const cell of cells) {
    const h = cell.h * scale * 1.1;
    const halfW = scale * 0.9;
    const halfD = scale * 0.45;

    const baseTop = { x: cell.sx, y: cell.sy - h };
    const glowBoost = phases.glowBoost * params.glow;
    const windowOn = cell.building > 0 && ((Math.sin(time * 12 + cell.seed * 18) + 1) * 0.5 > 0.62);

    ctx.fillStyle = `rgba(${Math.round(16 + glowBoost * 12)}, ${Math.round(68 + glowBoost * 55)}, ${Math.round(78 + glowBoost * 65)}, 0.92)`;
    ctx.beginPath();
    ctx.moveTo(baseTop.x, baseTop.y - halfD);
    ctx.lineTo(baseTop.x + halfW, baseTop.y);
    ctx.lineTo(baseTop.x, baseTop.y + halfD);
    ctx.lineTo(baseTop.x - halfW, baseTop.y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(7, 24, 33, 0.96)";
    ctx.beginPath();
    ctx.moveTo(baseTop.x - halfW, baseTop.y);
    ctx.lineTo(baseTop.x, baseTop.y + halfD);
    ctx.lineTo(baseTop.x, cell.sy + halfD);
    ctx.lineTo(baseTop.x - halfW, cell.sy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(10, 36, 46, 0.96)";
    ctx.beginPath();
    ctx.moveTo(baseTop.x + halfW, baseTop.y);
    ctx.lineTo(baseTop.x, baseTop.y + halfD);
    ctx.lineTo(baseTop.x, cell.sy + halfD);
    ctx.lineTo(baseTop.x + halfW, cell.sy);
    ctx.closePath();
    ctx.fill();

    if (windowOn && phases.glowBoost > 0) {
      ctx.fillStyle = `rgba(255, 186, 102, ${0.2 + phases.glowBoost * 0.55})`;
      ctx.fillRect(baseTop.x - halfW * 0.16, cell.sy - h * 0.55, Math.max(1, halfW * 0.3), Math.max(1, halfD * 0.4));
    }
  }
};

export class VoxelWorldBuilderEffect implements Effect {
  private renderer: WebGLVoxelWorldRenderer | null = null;
  private layout: VoxelWorldLayout | null = null;
  private previousSeed: number | null = null;
  private previousDensity = -1;
  private warned = false;

  render(context: EffectRenderContext): void {
    const params = normalizeVoxelWorldBuilderParams(context.params ?? {});

    if (!this.layout || this.previousSeed !== params.seed || Math.abs(this.previousDensity - params.cityDensity) > 0.001) {
      this.layout = createVoxelWorldLayout(GRID_SIZE, params.cityDensity, params.seed);
      this.previousSeed = params.seed;
      this.previousDensity = params.cityDensity;
      this.renderer = null;
    }

    if (!this.renderer) {
      this.renderer = new WebGLVoxelWorldRenderer(this.layout);
    }

    if (this.renderer.available && this.layout) {
      const rendered = this.renderer.render(context, params);
      if (rendered) {
        this.warned = false;
        return;
      }
    }

    if (!this.warned) {
      console.warn("[voxel_world_builder] WebGL2 unavailable; using Canvas2D fallback renderer.");
      this.warned = true;
    }

    if (this.layout) {
      drawVoxelFallback2D(context, this.layout, params);
    }
  }

  reset(): void {
    this.renderer = null;
    this.layout = null;
    this.previousSeed = null;
    this.previousDensity = -1;
    this.warned = false;
  }
}
