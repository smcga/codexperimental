import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { IsoGridEffect } from "./isoGridEffect";
import { setWebGLStatus } from "./gl/webglStatus";

// Assumptions:
// - The engine provides a WebGL-capable environment; this effect owns its WebGL2 canvas and blits into the shared 2D context.
// - Audio features may omit rms/bass/etc; missing values are treated as 0.

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform float u_time;
uniform float u_speed;
uniform float u_gridDepth;
uniform float u_noiseFreq;
uniform float u_amplitude;
uniform float u_bass;
uniform float u_bassReactive;
uniform float u_cameraHeight;
uniform float u_fov;
uniform float u_aspect;

out float v_depth;
out float v_height;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  float zOffset = u_time * u_speed * 18.0;
  float wrappedZ = mod(a_position.y + zOffset, u_gridDepth);
  float height = (valueNoise(vec2(a_position.x, a_position.y + zOffset) * u_noiseFreq) - 0.5) * 2.0;
  height *= u_amplitude;
  float bassPulse = sin((a_position.y + zOffset) * 0.18 - u_time * 2.1);
  height += bassPulse * u_bass * u_bassReactive * u_amplitude * 0.35;

  vec3 pos = vec3(a_position.x, height - u_cameraHeight, -(wrappedZ + 0.2));

  float nearPlane = 0.1;
  float farPlane = u_gridDepth * 2.2;
  float f = 1.0 / tan(radians(u_fov) * 0.5);

  float clipZ = (farPlane + nearPlane) / (nearPlane - farPlane) * pos.z
    + (2.0 * farPlane * nearPlane) / (nearPlane - farPlane);
  float clipW = -pos.z;

  gl_Position = vec4(pos.x * f / u_aspect, pos.y * f, clipZ, clipW);

  v_depth = wrappedZ / max(u_gridDepth, 0.001);
  v_height = height;
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in float v_depth;
in float v_height;

uniform float u_time;
uniform float u_neon;
uniform float u_fog;
uniform float u_bass;
uniform float u_rms;
uniform float u_rmsReactive;

out vec4 outColor;

void main() {
  vec3 nearColor = vec3(0.1, 0.95, 1.0);
  vec3 farColor = vec3(0.9, 0.2, 1.0);
  float depth = clamp(v_depth, 0.0, 1.0);
  vec3 color = mix(nearColor, farColor, depth);

  float fogFactor = smoothstep(0.35, 1.0, depth) * u_fog;
  float pulse = 1.0 + u_bass * 0.3 + u_rms * u_rmsReactive;
  float scan = 0.98 + 0.02 * sin(gl_FragCoord.y * 0.3 + u_time * 3.0);

  color *= u_neon * pulse;
  float alpha = (1.0 - fogFactor) * 0.9 * scan;
  alpha *= clamp(u_neon * pulse, 0.0, 1.5);

  outColor = vec4(color, alpha);
}
`;

export const WIREFRAME_RIDE_DEFAULTS = {
  speed: 1.0,
  gridWidth: 60.0,
  gridDepth: 120.0,
  gridResX: 160,
  gridResZ: 220,
  amplitude: 6.0,
  noiseFreq: 0.08,
  cameraHeight: 10.0,
  fov: 60,
  fog: 0.75,
  neon: 1.0,
  bassReactive: 0.6,
  rmsReactive: 0.35,
  sun: 1
};

export type WireframeRideParams = {
  speed: number;
  gridWidth: number;
  gridDepth: number;
  gridResX: number;
  gridResZ: number;
  amplitude: number;
  noiseFreq: number;
  cameraHeight: number;
  fov: number;
  fog: number;
  neon: number;
  bassReactive: number;
  rmsReactive: number;
  sun: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeWireframeRideParams(params: Record<string, number>): WireframeRideParams {
  const gridResX = clamp(Math.round(toFiniteNumber(params.gridResX, WIREFRAME_RIDE_DEFAULTS.gridResX)), 40, 320);
  const gridResZ = clamp(Math.round(toFiniteNumber(params.gridResZ, WIREFRAME_RIDE_DEFAULTS.gridResZ)), 60, 360);
  return {
    speed: clamp(toFiniteNumber(params.speed, WIREFRAME_RIDE_DEFAULTS.speed), 0.2, 3.0),
    gridWidth: clamp(toFiniteNumber(params.gridWidth, WIREFRAME_RIDE_DEFAULTS.gridWidth), 20, 140),
    gridDepth: clamp(toFiniteNumber(params.gridDepth, WIREFRAME_RIDE_DEFAULTS.gridDepth), 40, 240),
    gridResX,
    gridResZ,
    amplitude: clamp(toFiniteNumber(params.amplitude, WIREFRAME_RIDE_DEFAULTS.amplitude), 0, 18),
    noiseFreq: clamp(toFiniteNumber(params.noiseFreq, WIREFRAME_RIDE_DEFAULTS.noiseFreq), 0.02, 0.2),
    cameraHeight: clamp(toFiniteNumber(params.cameraHeight, WIREFRAME_RIDE_DEFAULTS.cameraHeight), 2, 24),
    fov: clamp(toFiniteNumber(params.fov, WIREFRAME_RIDE_DEFAULTS.fov), 40, 90),
    fog: clamp(toFiniteNumber(params.fog, WIREFRAME_RIDE_DEFAULTS.fog), 0, 1),
    neon: clamp(toFiniteNumber(params.neon, WIREFRAME_RIDE_DEFAULTS.neon), 0.4, 2.5),
    bassReactive: clamp(toFiniteNumber(params.bassReactive, WIREFRAME_RIDE_DEFAULTS.bassReactive), 0, 1.5),
    rmsReactive: clamp(toFiniteNumber(params.rmsReactive, WIREFRAME_RIDE_DEFAULTS.rmsReactive), 0, 1.5),
    sun: clamp(toFiniteNumber(params.sun, WIREFRAME_RIDE_DEFAULTS.sun), 0, 1)
  };
}

export function buildWireframeGridVertices(
  resX: number,
  resZ: number,
  width: number,
  depth: number
): Float32Array {
  const vertices = new Float32Array(resX * resZ * 2);
  let offset = 0;
  const halfWidth = width * 0.5;
  for (let z = 0; z < resZ; z += 1) {
    const zT = resZ === 1 ? 0 : z / (resZ - 1);
    const zPos = zT * depth;
    for (let x = 0; x < resX; x += 1) {
      const xT = resX === 1 ? 0 : x / (resX - 1);
      const xPos = -halfWidth + xT * width;
      vertices[offset++] = xPos;
      vertices[offset++] = zPos;
    }
  }
  return vertices;
}

export function buildWireframeGridIndices(resX: number, resZ: number): Uint32Array {
  const lineCount = resZ * (resX - 1) + resX * (resZ - 1);
  const indices = new Uint32Array(lineCount * 2);
  let offset = 0;
  for (let z = 0; z < resZ; z += 1) {
    for (let x = 0; x < resX - 1; x += 1) {
      const index = z * resX + x;
      indices[offset++] = index;
      indices[offset++] = index + 1;
    }
  }
  for (let x = 0; x < resX; x += 1) {
    for (let z = 0; z < resZ - 1; z += 1) {
      const index = z * resX + x;
      indices[offset++] = index;
      indices[offset++] = index + resX;
    }
  }
  return indices;
}

class WireframeRideGLRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private ibo: WebGLBuffer | null = null;
  private indexCount = 0;
  private indexType: number | null = null;
  private size = { width: 0, height: 0 };
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private errorMessage: string | null = null;
  private gridSignature = "";

  constructor() {
    this.init();
  }

  get lastError(): string | null {
    return this.errorMessage;
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    audio: EffectRenderContext["audio"],
    params: WireframeRideParams
  ): boolean {
    if (!this.gl || !this.program || !this.canvas || this.errorMessage) {
      return false;
    }
    this.resize(width, height);
    this.ensureGrid(params);
    if (!this.indexType || this.indexCount === 0) {
      return false;
    }

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    gl.viewport(0, 0, this.size.width, this.size.height);
    gl.clearColor(0.03, 0.0, 0.08, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const bass = clamp(audio.bass ?? 0, 0, 1);
    const rms = clamp(audio.rms ?? 0, 0, 1);

    this.setUniforms({
      u_time: time,
      u_speed: params.speed,
      u_gridDepth: params.gridDepth,
      u_noiseFreq: params.noiseFreq,
      u_amplitude: params.amplitude,
      u_bass: bass,
      u_bassReactive: params.bassReactive,
      u_cameraHeight: params.cameraHeight,
      u_fov: params.fov,
      u_aspect: this.size.width / Math.max(1, this.size.height),
      u_neon: params.neon,
      u_fog: params.fog,
      u_rms: rms,
      u_rmsReactive: params.rmsReactive
    });

    gl.drawElements(gl.LINES, this.indexCount, this.indexType, 0);

    ctx.drawImage(this.canvas, 0, 0, width, height);
    return true;
  }

  private init(): void {
    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      this.errorMessage = "WebGL2 unavailable";
      return;
    }
    this.gl = gl;
    const program = this.createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) {
      this.errorMessage = "WebGL2 shader compile failed";
      return;
    }
    this.program = program;
    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    if (!this.vao || !this.vbo || !this.ibo) {
      this.errorMessage = "WebGL2 buffer allocation failed";
      return;
    }

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    this.uniformLocations = {
      u_time: gl.getUniformLocation(program, "u_time"),
      u_speed: gl.getUniformLocation(program, "u_speed"),
      u_gridDepth: gl.getUniformLocation(program, "u_gridDepth"),
      u_noiseFreq: gl.getUniformLocation(program, "u_noiseFreq"),
      u_amplitude: gl.getUniformLocation(program, "u_amplitude"),
      u_bass: gl.getUniformLocation(program, "u_bass"),
      u_bassReactive: gl.getUniformLocation(program, "u_bassReactive"),
      u_cameraHeight: gl.getUniformLocation(program, "u_cameraHeight"),
      u_fov: gl.getUniformLocation(program, "u_fov"),
      u_aspect: gl.getUniformLocation(program, "u_aspect"),
      u_neon: gl.getUniformLocation(program, "u_neon"),
      u_fog: gl.getUniformLocation(program, "u_fog"),
      u_rms: gl.getUniformLocation(program, "u_rms"),
      u_rmsReactive: gl.getUniformLocation(program, "u_rmsReactive")
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.lineWidth(1);
  }

  private resize(width: number, height: number): void {
    if (!this.canvas) {
      return;
    }
    const nextWidth = Math.max(1, Math.floor(width));
    const nextHeight = Math.max(1, Math.floor(height));
    if (nextWidth === this.size.width && nextHeight === this.size.height) {
      return;
    }
    this.size = { width: nextWidth, height: nextHeight };
    this.canvas.width = nextWidth;
    this.canvas.height = nextHeight;
  }

  private ensureGrid(params: WireframeRideParams): void {
    if (!this.gl || !this.vbo || !this.ibo) {
      return;
    }
    const signature = `${params.gridResX}|${params.gridResZ}|${params.gridWidth}|${params.gridDepth}`;
    if (signature === this.gridSignature) {
      return;
    }
    this.gridSignature = signature;

    const vertices = buildWireframeGridVertices(
      params.gridResX,
      params.gridResZ,
      params.gridWidth,
      params.gridDepth
    );
    const indices = buildWireframeGridIndices(params.gridResX, params.gridResZ);

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    this.indexCount = indices.length;
    this.indexType = gl.UNSIGNED_INT;
  }

  private setUniforms(values: Record<string, number>): void {
    if (!this.gl) {
      return;
    }
    const gl = this.gl;
    Object.entries(values).forEach(([key, value]) => {
      const location = this.uniformLocations[key];
      if (!location || !Number.isFinite(value)) {
        return;
      }
      gl.uniform1f(location, value);
    });
  }

  private createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const vertexShader = this.compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return null;
    }
    const program = gl.createProgram();
    if (!program) {
      return null;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn(`[wireframeRide] WebGL2 program link failed: ${gl.getProgramInfoLog(program) ?? ""}`);
      gl.deleteProgram(program);
      return null;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  private compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(`[wireframeRide] WebGL2 shader compile failed: ${gl.getShaderInfoLog(shader) ?? ""}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}

const drawSunOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: WireframeRideParams,
  audio: EffectRenderContext["audio"]
): void => {
  if (params.sun <= 0) {
    return;
  }
  const rms = clamp(audio.rms ?? 0, 0, 1);
  const glowStrength = clamp(0.6 + rms * params.rmsReactive, 0.4, 1.2);
  const sunRadius = height * 0.18;
  const sunX = width * 0.5;
  const sunY = height * 0.58;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const glow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius);
  glow.addColorStop(0, `rgba(255, 200, 140, ${0.7 * glowStrength})`);
  glow.addColorStop(0.6, `rgba(255, 130, 190, ${0.35 * glowStrength})`);
  glow.addColorStop(1, "rgba(90, 20, 140, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.fill();

  const horizonGlow = ctx.createLinearGradient(0, sunY - sunRadius * 0.6, 0, sunY + sunRadius * 1.2);
  horizonGlow.addColorStop(0, "rgba(255, 120, 200, 0)");
  horizonGlow.addColorStop(0.5, `rgba(255, 120, 200, ${0.2 * glowStrength})`);
  horizonGlow.addColorStop(1, "rgba(20, 0, 40, 0)");
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, sunY - sunRadius, width, sunRadius * 2);

  ctx.restore();
};

export class WireframeRideEffect implements Effect {
  private webgl: WireframeRideGLRenderer | null = null;
  private fallbackEffect = new IsoGridEffect();
  private warned = false;

  constructor() {
    this.webgl = new WireframeRideGLRenderer();
  }

  render(context: EffectRenderContext): void {
    const params = normalizeWireframeRideParams(context.params ?? {});
    const rendered = this.webgl?.render(context.ctx, context.width, context.height, context.time, context.audio, params);

    if (rendered) {
      this.warned = false;
      setWebGLStatus({ mode: "ok" });
      drawSunOverlay(context.ctx, context.width, context.height, params, context.audio);
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[wireframeRide] ${reason}. Falling back to iso grid effect.`);
      this.warned = true;
    }
    setWebGLStatus({ mode: "fallback", reason: this.webgl?.lastError ?? "WebGL2 unavailable" });
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
  }
}
