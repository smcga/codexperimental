import { clamp } from "../../util/math";
import { setWebGLStatus } from "./gl/webglStatus";
import { IsoGridEffect } from "./isoGridEffect";
import { Effect, EffectRenderContext } from "./types";

const VERTEX_SHADER_SOURCE = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;

uniform float u_time;
uniform float u_speed;
uniform float u_trackDepth;
uniform float u_cameraBob;
uniform float u_curveStrength;
uniform float u_curveFrequency;
uniform float u_fov;
uniform float u_aspect;
uniform float u_rms;
uniform float u_rmsReactive;

out float v_depth;
out float v_trackZ;
out float v_trackX;

void main() {
  float zOffset = u_time * u_speed * 30.0;
  float trackZ = a_position.y + zOffset;
  float bob = sin(u_time * 2.4) * u_cameraBob * (0.5 + 0.5 * u_rms * u_rmsReactive);
  bob = max(bob, -u_cameraBob * 0.22);
  float depthNorm = a_position.y / max(u_trackDepth, 0.001);
  float curvePhase = depthNorm * 6.28318530718;
  float curveDensity = mix(1.0, 4.5, clamp((u_curveFrequency - 0.015) / 0.185, 0.0, 1.0));
  float travelPhase = u_time * u_speed * (0.55 + u_curveFrequency * 8.0);
  float longBend = sin(curvePhase * curveDensity - travelPhase) * u_curveStrength;
  float shortBend = sin(curvePhase * (curveDensity * 2.0) + travelPhase * 1.7 + 0.9) * u_curveStrength * 0.35;
  float curveOffset = (longBend + shortBend) * (0.35 + 0.65 * depthNorm);

  vec3 pos = vec3(a_position.x + curveOffset, -0.46 - bob, -(a_position.y + 0.6));

  float nearPlane = 0.1;
  float farPlane = u_trackDepth * 2.4;
  float f = 1.0 / tan(radians(u_fov) * 0.5);

  float clipZ = (farPlane + nearPlane) / (nearPlane - farPlane) * pos.z
    + (2.0 * farPlane * nearPlane) / (nearPlane - farPlane);
  float clipW = -pos.z;

  gl_Position = vec4(pos.x * f / u_aspect, pos.y * f, clipZ, clipW);

  v_depth = depthNorm;
  v_trackZ = trackZ;
  v_trackX = a_position.x;
}
`;

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in float v_depth;
in float v_trackZ;
in float v_trackX;

uniform float u_time;
uniform float u_speed;
uniform float u_roadWidth;
uniform float u_laneDashLength;
uniform float u_laneGap;
uniform float u_fog;
uniform float u_glow;
uniform float u_bass;
uniform float u_rms;
uniform float u_bassReactive;
uniform float u_rmsReactive;

out vec4 outColor;

void main() {
  float depth = clamp(v_depth, 0.0, 1.0);
  float roadHalf = u_roadWidth * 0.5;
  float absX = abs(v_trackX);

  vec3 nearAsphalt = vec3(0.07, 0.08, 0.1);
  vec3 farAsphalt = vec3(0.02, 0.03, 0.05);
  vec3 color = mix(nearAsphalt, farAsphalt, depth);

  float centerLineWidth = max(0.025, u_roadWidth * 0.015);
  float centerMask = 1.0 - smoothstep(centerLineWidth, centerLineWidth * 2.2, absX);
  float cycle = max(0.05, u_laneDashLength + u_laneGap);
  float dashPhase = mod(v_trackZ + u_time * u_speed * 12.0, cycle);
  float dashMask = 1.0 - step(u_laneDashLength, dashPhase);
  vec3 laneColor = vec3(1.0, 0.95, 0.75);
  color = mix(color, laneColor, centerMask * dashMask);

  float edgeBand = 0.03 + roadHalf * 0.03;
  float edgeDistance = abs(absX - roadHalf);
  float edgeLine = 1.0 - smoothstep(edgeBand, edgeBand * 4.0, edgeDistance);
  vec3 edgeColor = vec3(0.8, 0.9, 1.0) * (0.7 + 0.8 * u_glow);
  color += edgeColor * edgeLine;

  float railDistance = abs(absX - (roadHalf + 0.8));
  float rail = 1.0 - smoothstep(0.06, 0.45, railDistance);
  float lightPulse = 0.7 + 0.3 * sin(v_trackZ * 0.14 - u_time * 3.0);
  float bassLight = 1.0 + u_bass * u_bassReactive * 1.5;
  vec3 railColor = vec3(0.2, 0.65, 1.0) * (0.5 + u_glow) * bassLight * lightPulse;
  color += railColor * rail;

  float horizon = smoothstep(0.55, 1.0, depth);
  color += vec3(0.32, 0.12, 0.45) * horizon * (0.4 + 0.6 * u_glow);

  float fogPulse = 0.85 + u_rms * u_rmsReactive * 0.5;
  float fog = smoothstep(0.22, 1.0, depth) * u_fog * fogPulse;
  color = mix(color, vec3(0.09, 0.04, 0.12), fog);

  float vignette = smoothstep(0.0, roadHalf + 3.4, absX);
  color *= mix(1.0, 0.45, vignette * 0.35);

  outColor = vec4(color, 1.0);
}
`;

export const ROAD_DRIVE_DEFAULTS = {
  speed: 1.0,
  roadWidth: 8.0,
  laneDashLength: 2.8,
  laneGap: 2.2,
  fog: 0.68,
  glow: 1.0,
  cameraBob: 0.22,
  curveStrength: 1.6,
  curveFrequency: 0.06,
  bassReactive: 0.85,
  rmsReactive: 0.45
};

export type RoadDriveParams = {
  speed: number;
  roadWidth: number;
  laneDashLength: number;
  laneGap: number;
  fog: number;
  glow: number;
  cameraBob: number;
  curveStrength: number;
  curveFrequency: number;
  bassReactive: number;
  rmsReactive: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export function normalizeRoadDriveParams(params: Record<string, number>): RoadDriveParams {
  return {
    speed: clamp(toFiniteNumber(params.speed, ROAD_DRIVE_DEFAULTS.speed), 0.2, 3.2),
    roadWidth: clamp(toFiniteNumber(params.roadWidth, ROAD_DRIVE_DEFAULTS.roadWidth), 4, 20),
    laneDashLength: clamp(toFiniteNumber(params.laneDashLength, ROAD_DRIVE_DEFAULTS.laneDashLength), 0.4, 10),
    laneGap: clamp(toFiniteNumber(params.laneGap, ROAD_DRIVE_DEFAULTS.laneGap), 0.2, 10),
    fog: clamp(toFiniteNumber(params.fog, ROAD_DRIVE_DEFAULTS.fog), 0, 1),
    glow: clamp(toFiniteNumber(params.glow, ROAD_DRIVE_DEFAULTS.glow), 0.1, 2.5),
    cameraBob: clamp(toFiniteNumber(params.cameraBob, ROAD_DRIVE_DEFAULTS.cameraBob), 0, 1.5),
    curveStrength: clamp(toFiniteNumber(params.curveStrength, ROAD_DRIVE_DEFAULTS.curveStrength), 0, 6),
    curveFrequency: clamp(toFiniteNumber(params.curveFrequency, ROAD_DRIVE_DEFAULTS.curveFrequency), 0.015, 0.2),
    bassReactive: clamp(toFiniteNumber(params.bassReactive, ROAD_DRIVE_DEFAULTS.bassReactive), 0, 2),
    rmsReactive: clamp(toFiniteNumber(params.rmsReactive, ROAD_DRIVE_DEFAULTS.rmsReactive), 0, 2)
  };
}

export function buildRoadDriveVertices(resX: number, resZ: number, width: number, depth: number): Float32Array {
  const vertices = new Float32Array(resX * resZ * 2);
  const halfWidth = width * 0.5;
  let offset = 0;

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

export function buildRoadDriveIndices(resX: number, resZ: number): Uint32Array {
  const quadCount = (resX - 1) * (resZ - 1);
  const indices = new Uint32Array(quadCount * 6);
  let offset = 0;

  for (let z = 0; z < resZ - 1; z += 1) {
    for (let x = 0; x < resX - 1; x += 1) {
      const i0 = z * resX + x;
      const i1 = i0 + 1;
      const i2 = i0 + resX;
      const i3 = i2 + 1;

      indices[offset++] = i0;
      indices[offset++] = i2;
      indices[offset++] = i1;

      indices[offset++] = i1;
      indices[offset++] = i2;
      indices[offset++] = i3;
    }
  }

  return indices;
}

class RoadDriveGLRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private ibo: WebGLBuffer | null = null;
  private indexCount = 0;
  private indexType: number | null = null;
  private size = { width: 0, height: 0 };
  private errorMessage: string | null = null;
  private meshSignature = "";
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};

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
    params: RoadDriveParams
  ): boolean {
    if (!this.gl || !this.program || !this.canvas || this.errorMessage) {
      return false;
    }

    this.resize(width, height);
    this.ensureMesh(params.roadWidth);

    if (!this.indexType || this.indexCount === 0) {
      return false;
    }

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);

    gl.viewport(0, 0, this.size.width, this.size.height);
    gl.clearColor(0.01, 0.01, 0.03, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const bass = clamp(audio.bass ?? 0, 0, 1);
    const rms = clamp(audio.rms ?? 0, 0, 1);

    this.setUniforms({
      u_time: time,
      u_speed: params.speed,
      u_trackDepth: 180,
      u_cameraBob: params.cameraBob,
      u_curveStrength: params.curveStrength,
      u_curveFrequency: params.curveFrequency,
      u_fov: 62,
      u_aspect: this.size.width / Math.max(1, this.size.height),
      u_rms: rms,
      u_rmsReactive: params.rmsReactive,
      u_roadWidth: params.roadWidth,
      u_laneDashLength: params.laneDashLength,
      u_laneGap: params.laneGap,
      u_fog: params.fog,
      u_glow: params.glow,
      u_bass: bass,
      u_bassReactive: params.bassReactive
    });

    gl.drawElements(gl.TRIANGLES, this.indexCount, this.indexType, 0);
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
      u_trackDepth: gl.getUniformLocation(program, "u_trackDepth"),
      u_cameraBob: gl.getUniformLocation(program, "u_cameraBob"),
      u_curveStrength: gl.getUniformLocation(program, "u_curveStrength"),
      u_curveFrequency: gl.getUniformLocation(program, "u_curveFrequency"),
      u_fov: gl.getUniformLocation(program, "u_fov"),
      u_aspect: gl.getUniformLocation(program, "u_aspect"),
      u_rms: gl.getUniformLocation(program, "u_rms"),
      u_rmsReactive: gl.getUniformLocation(program, "u_rmsReactive"),
      u_roadWidth: gl.getUniformLocation(program, "u_roadWidth"),
      u_laneDashLength: gl.getUniformLocation(program, "u_laneDashLength"),
      u_laneGap: gl.getUniformLocation(program, "u_laneGap"),
      u_fog: gl.getUniformLocation(program, "u_fog"),
      u_glow: gl.getUniformLocation(program, "u_glow"),
      u_bass: gl.getUniformLocation(program, "u_bass"),
      u_bassReactive: gl.getUniformLocation(program, "u_bassReactive")
    };

    gl.enable(gl.DEPTH_TEST);
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

  private ensureMesh(roadWidth: number): void {
    if (!this.gl || !this.vbo || !this.ibo) {
      return;
    }

    const resX = 18;
    const resZ = 200;
    const width = roadWidth + 12;
    const depth = 180;

    const signature = `${resX}|${resZ}|${width.toFixed(3)}|${depth}`;
    if (signature === this.meshSignature) {
      return;
    }
    this.meshSignature = signature;

    const vertices = buildRoadDriveVertices(resX, resZ, width, depth);
    const indices = buildRoadDriveIndices(resX, resZ);

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

    Object.entries(values).forEach(([key, value]) => {
      const location = this.uniformLocations[key];
      if (!location || !Number.isFinite(value)) {
        return;
      }
      this.gl?.uniform1f(location, value);
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
      console.warn(`[roadDrive] WebGL2 program link failed: ${gl.getProgramInfoLog(program) ?? ""}`);
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
      console.warn(`[roadDrive] WebGL2 shader compile failed: ${gl.getShaderInfoLog(shader) ?? ""}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}

export class RoadDriveEffect implements Effect {
  private webgl: RoadDriveGLRenderer | null = null;
  private fallbackEffect = new IsoGridEffect();
  private warned = false;

  constructor() {
    this.webgl = new RoadDriveGLRenderer();
  }

  render(context: EffectRenderContext): void {
    const params = normalizeRoadDriveParams(context.params ?? {});
    const rendered = this.webgl?.render(context.ctx, context.width, context.height, context.time, context.audio, params);

    if (rendered) {
      this.warned = false;
      setWebGLStatus({ mode: "ok" });
      return;
    }

    if (!this.warned) {
      const reason = this.webgl?.lastError ?? "WebGL2 unavailable or shader failed";
      console.warn(`[roadDrive] ${reason}. Falling back to iso grid effect.`);
      this.warned = true;
    }

    setWebGLStatus({ mode: "fallback", reason: this.webgl?.lastError ?? "WebGL2 unavailable" });
    this.fallbackEffect.render(context);
  }

  reset(): void {
    this.warned = false;
  }
}
