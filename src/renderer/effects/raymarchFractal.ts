import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { FractalEffect } from "./fractalEffect";
import { setWebGLStatus } from "./gl/webglStatus";

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;

varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uBass;
uniform float uBeat;
uniform int uMode;
uniform float uQuality;
uniform float uCameraRadius;
uniform float uCameraHeight;
uniform float uCameraOrbitSpeed;
uniform float uPaletteSpeed;
uniform float uAudioReact;
uniform float uBeatKick;
uniform float uFractalScale;

varying vec2 vUv;

const int MAX_STEPS = 120;
const float FAR = 24.0;
const float EPS = 0.001;

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float mandelbulb(vec3 p) {
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  const float power = 8.0;
  for (int i = 0; i < 8; i += 1) {
    r = length(z);
    if (r > 2.0) {
      break;
    }
    float theta = acos(z.z / max(r, 0.0001));
    float phi = atan(z.y, z.x);
    dr = pow(r, power - 1.0) * power * dr + 1.0;
    float zr = pow(r, power);
    theta *= power;
    phi *= power;
    z = zr * vec3(
      sin(theta) * cos(phi),
      sin(theta) * sin(phi),
      cos(theta)
    );
    z += p;
  }
  float safeR = max(r, 0.0001);
  return 0.5 * log(safeR) * r / dr;
}

float mandelbox(vec3 p) {
  vec3 z = p;
  float dr = 1.0;
  const float scale = 2.2;
  const float minRadius = 0.5;
  const float fixedRadius = 1.2;
  for (int i = 0; i < 10; i += 1) {
    z = clamp(z, -1.0, 1.0) * 2.0 - z;
    float r2 = dot(z, z);
    float minR2 = minRadius * minRadius;
    float fixedR2 = fixedRadius * fixedRadius;
    if (r2 < minR2) {
      float t = fixedR2 / minR2;
      z *= t;
      dr *= t;
    } else if (r2 < fixedR2) {
      float t = fixedR2 / r2;
      z *= t;
      dr *= t;
    }
    z = z * scale + p;
    dr = dr * abs(scale) + 1.0;
  }
  return length(z) / abs(dr);
}

float sceneSdf(vec3 p) {
  float scale = max(0.2, uFractalScale + uBass * 0.4 * uAudioReact);
  vec3 fp = p * scale;
  float fractal = (uMode == 0 ? mandelbulb(fp) : mandelbox(fp)) / scale;
  float ground = p.y + 1.1 + sin(p.x * 0.4 + uTime * 0.5) * 0.05;
  float bubble = sdSphere(p - vec3(0.0, 0.2, 0.0), 0.3);
  float base = min(fractal, ground);
  return min(base, bubble);
}

vec3 estimateNormal(vec3 p) {
  vec2 e = vec2(EPS, 0.0);
  return normalize(vec3(
    sceneSdf(p + e.xyy) - sceneSdf(p - e.xyy),
    sceneSdf(p + e.yxy) - sceneSdf(p - e.yxy),
    sceneSdf(p + e.yyx) - sceneSdf(p - e.yyx)
  ));
}

vec3 palette(float t) {
  return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
}

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  float orbit = uTime * uCameraOrbitSpeed;
  float beatPulse = uBeat * uBeatKick;
  float radius = uCameraRadius + uBass * 0.8 * uAudioReact + beatPulse * 0.25;
  float height = uCameraHeight + sin(uTime * 0.6) * 0.35 * uAudioReact;

  vec3 ro = vec3(sin(orbit) * radius, height, cos(orbit) * radius);
  vec3 target = vec3(0.0, 0.0, 0.0);
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 rd = normalize(forward + uv.x * right * 1.1 + uv.y * up * 1.1);

  float totalDist = 0.0;
  float hit = 0.0;
  int steps = int(float(MAX_STEPS) * clamp(uQuality, 0.5, 1.5));
  int stepIndex = 0;

  for (int i = 0; i < MAX_STEPS; i += 1) {
    if (i >= steps) {
      break;
    }
    vec3 pos = ro + rd * totalDist;
    float d = sceneSdf(pos);
    if (d < EPS) {
      hit = 1.0;
      stepIndex = i;
      break;
    }
    totalDist += d;
    if (totalDist > FAR) {
      break;
    }
  }

  vec3 color = vec3(0.02, 0.03, 0.05);
  vec3 bg = mix(vec3(0.02, 0.02, 0.04), vec3(0.1, 0.1, 0.2), vUv.y);

  if (hit > 0.5) {
    vec3 pos = ro + rd * totalDist;
    vec3 normal = estimateNormal(pos);
    vec3 lightDir = normalize(vec3(0.4, 0.7, -0.5));
    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.15;
    vec3 halfDir = normalize(lightDir - rd);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    float rim = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);

    float t = float(stepIndex) / float(max(steps, 1));
    float palettePhase = t + uTime * uPaletteSpeed + beatPulse * 0.2;
    vec3 baseColor = palette(palettePhase);
    color = baseColor * (diffuse + ambient) + spec * 0.8 + rim * 0.35;

    float fog = exp(-0.08 * totalDist * totalDist);
    color = mix(bg, color, fog);
  } else {
    color = bg;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

const DEFAULTS = {
  quality: 1.0,
  fractal: "mandelbulb" as const,
  cameraRadius: 4.0,
  cameraHeight: 0.0,
  cameraOrbitSpeed: 0.2,
  paletteSpeed: 0.15,
  audioReact: 0.6,
  beatKick: 0.5,
  fractalScale: 1.0
};

const FRACTAL_MODES = {
  mandelbulb: 0,
  mandelbox: 1
} as const;

export type RaymarchFractalParams = {
  quality: number;
  fractal: keyof typeof FRACTAL_MODES;
  cameraRadius: number;
  cameraHeight: number;
  cameraOrbitSpeed: number;
  paletteSpeed: number;
  audioReact: number;
  beatKick: number;
  fractalScale: number;
};

export type RaymarchFractalUniforms = {
  time: number;
  resolution: [number, number];
  bass: number;
  beat: number;
  mode: number;
  quality: number;
  cameraRadius: number;
  cameraHeight: number;
  cameraOrbitSpeed: number;
  paletteSpeed: number;
  audioReact: number;
  beatKick: number;
  fractalScale: number;
};

const toFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolveFractalMode = (value: unknown): keyof typeof FRACTAL_MODES => {
  if (value === "mandelbox") {
    return "mandelbox";
  }
  return "mandelbulb";
};

export const normalizeRaymarchFractalParams = (params: Record<string, unknown>): RaymarchFractalParams => {
  const quality = clamp(toFiniteNumber(params.quality, DEFAULTS.quality), 0.5, 1.5);
  const cameraRadius = clamp(toFiniteNumber(params.cameraRadius, DEFAULTS.cameraRadius), 2.0, 8.0);
  const cameraHeight = clamp(toFiniteNumber(params.cameraHeight, DEFAULTS.cameraHeight), -2.0, 2.0);
  const cameraOrbitSpeed = clamp(
    toFiniteNumber(params.cameraOrbitSpeed, DEFAULTS.cameraOrbitSpeed),
    0.0,
    1.0
  );
  const paletteSpeed = clamp(toFiniteNumber(params.paletteSpeed, DEFAULTS.paletteSpeed), 0.0, 0.6);
  const audioReact = clamp(toFiniteNumber(params.audioReact, DEFAULTS.audioReact), 0.0, 1.0);
  const beatKick = clamp(toFiniteNumber(params.beatKick, DEFAULTS.beatKick), 0.0, 1.0);
  const fractalScale = clamp(toFiniteNumber(params.fractalScale, DEFAULTS.fractalScale), 0.4, 2.2);
  const fractal = resolveFractalMode(params.fractal);

  return {
    quality,
    fractal,
    cameraRadius,
    cameraHeight,
    cameraOrbitSpeed,
    paletteSpeed,
    audioReact,
    beatKick,
    fractalScale
  };
};

export const buildRaymarchFractalUniforms = (
  time: number,
  width: number,
  height: number,
  audio: EffectRenderContext["audio"],
  params: RaymarchFractalParams
): RaymarchFractalUniforms => ({
  time,
  resolution: [width, height],
  bass: clamp(audio.bass, 0, 1),
  beat: audio.beat ? 1 : 0,
  mode: FRACTAL_MODES[params.fractal],
  quality: params.quality,
  cameraRadius: params.cameraRadius,
  cameraHeight: params.cameraHeight,
  cameraOrbitSpeed: params.cameraOrbitSpeed,
  paletteSpeed: params.paletteSpeed,
  audioReact: params.audioReact,
  beatKick: params.beatKick,
  fractalScale: params.fractalScale
});

type UniformLocations = {
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uBass: WebGLUniformLocation | null;
  uBeat: WebGLUniformLocation | null;
  uMode: WebGLUniformLocation | null;
  uQuality: WebGLUniformLocation | null;
  uCameraRadius: WebGLUniformLocation | null;
  uCameraHeight: WebGLUniformLocation | null;
  uCameraOrbitSpeed: WebGLUniformLocation | null;
  uPaletteSpeed: WebGLUniformLocation | null;
  uAudioReact: WebGLUniformLocation | null;
  uBeatKick: WebGLUniformLocation | null;
  uFractalScale: WebGLUniformLocation | null;
};

export class RaymarchFractalEffect implements Effect {
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private buffer: WebGLBuffer | null = null;
  private uniformLocations: UniformLocations | null = null;
  private positionLocation = -1;
  private warned = false;
  private fallback = new FractalEffect();

  render(context: EffectRenderContext): void {
    const params = normalizeRaymarchFractalParams(context.params as Record<string, unknown>);
    if (!this.ensureInitialized()) {
      this.fallback.render(context);
      return;
    }

    const gl = this.gl;
    const program = this.program;
    if (!gl || !program || !this.canvas || !this.uniformLocations || !this.buffer) {
      this.fallback.render(context);
      return;
    }

    const { width, height, time, audio } = context;
    const uniforms = buildRaymarchFractalUniforms(time, width, height, audio, params);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);

    const set1f = (location: WebGLUniformLocation | null, value: number): void => {
      if (location) {
        gl.uniform1f(location, value);
      }
    };
    const set1i = (location: WebGLUniformLocation | null, value: number): void => {
      if (location) {
        gl.uniform1i(location, value);
      }
    };
    if (this.uniformLocations.uResolution) {
      gl.uniform2f(this.uniformLocations.uResolution, uniforms.resolution[0], uniforms.resolution[1]);
    }
    set1f(this.uniformLocations.uTime, uniforms.time);
    set1f(this.uniformLocations.uBass, uniforms.bass);
    set1f(this.uniformLocations.uBeat, uniforms.beat);
    set1i(this.uniformLocations.uMode, uniforms.mode);
    set1f(this.uniformLocations.uQuality, uniforms.quality);
    set1f(this.uniformLocations.uCameraRadius, uniforms.cameraRadius);
    set1f(this.uniformLocations.uCameraHeight, uniforms.cameraHeight);
    set1f(this.uniformLocations.uCameraOrbitSpeed, uniforms.cameraOrbitSpeed);
    set1f(this.uniformLocations.uPaletteSpeed, uniforms.paletteSpeed);
    set1f(this.uniformLocations.uAudioReact, uniforms.audioReact);
    set1f(this.uniformLocations.uBeatKick, uniforms.beatKick);
    set1f(this.uniformLocations.uFractalScale, uniforms.fractalScale);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    context.ctx.drawImage(this.canvas, 0, 0, width, height);
    setWebGLStatus({ mode: "ok" });
  }

  reset(): void {
    this.warned = false;
  }

  private ensureInitialized(): boolean {
    if (this.gl && this.program && this.buffer && this.uniformLocations) {
      return true;
    }

    this.canvas = document.createElement("canvas");
    const gl = this.canvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: false });
    if (!gl) {
      this.reportFallback("WebGL unavailable");
      return false;
    }

    const program = this.createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
    if (!program) {
      this.reportFallback("WebGL shader compile failed");
      return false;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      this.reportFallback("WebGL buffer allocation failed");
      return false;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1
      ]),
      gl.STATIC_DRAW
    );

    this.positionLocation = gl.getAttribLocation(program, "aPosition");
    this.uniformLocations = {
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uTime: gl.getUniformLocation(program, "uTime"),
      uBass: gl.getUniformLocation(program, "uBass"),
      uBeat: gl.getUniformLocation(program, "uBeat"),
      uMode: gl.getUniformLocation(program, "uMode"),
      uQuality: gl.getUniformLocation(program, "uQuality"),
      uCameraRadius: gl.getUniformLocation(program, "uCameraRadius"),
      uCameraHeight: gl.getUniformLocation(program, "uCameraHeight"),
      uCameraOrbitSpeed: gl.getUniformLocation(program, "uCameraOrbitSpeed"),
      uPaletteSpeed: gl.getUniformLocation(program, "uPaletteSpeed"),
      uAudioReact: gl.getUniformLocation(program, "uAudioReact"),
      uBeatKick: gl.getUniformLocation(program, "uBeatKick"),
      uFractalScale: gl.getUniformLocation(program, "uFractalScale")
    };

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);

    this.gl = gl;
    this.program = program;
    this.buffer = buffer;

    return true;
  }

  private createProgram(
    gl: WebGLRenderingContext,
    vertexSource: string,
    fragmentSource: string
  ): WebGLProgram | null {
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
      const info = gl.getProgramInfoLog(program) ?? "Unknown program link error";
      this.reportFallback(`WebGL program link failed: ${info}`);
      gl.deleteProgram(program);
      return null;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return program;
  }

  private compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) ?? "Unknown shader compile error";
      this.reportFallback(`WebGL shader compile failed: ${info}`);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private reportFallback(reason: string): void {
    if (!this.warned) {
      console.warn(`[raymarch_fractal] ${reason}`);
      this.warned = true;
    }
    setWebGLStatus({ mode: "fallback", reason });
  }
}
