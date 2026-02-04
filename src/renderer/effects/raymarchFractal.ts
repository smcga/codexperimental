import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";
import { FractalEffect } from "./fractalEffect";
import { WebGLEffectBase, WebGLUniformPayload } from "./gl/webglEffectBase";

const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_bass;
uniform float u_beat;
uniform int u_mode;
uniform float u_quality;
uniform float u_cameraRadius;
uniform float u_cameraHeight;
uniform float u_cameraOrbitSpeed;
uniform float u_paletteSpeed;
uniform float u_audioReact;
uniform float u_beatKick;
uniform float u_fractalScale;
uniform int u_steps;

out vec4 fragColor;

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
  float scale = max(0.2, u_fractalScale + u_bass * 0.4 * u_audioReact);
  vec3 fp = p * scale;
  float fractal = (u_mode == 0 ? mandelbulb(fp) : mandelbox(fp)) / scale;
  float ground = p.y + 1.1 + sin(p.x * 0.4 + u_time * 0.5) * 0.05;
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
  vec2 uv = (gl_FragCoord.xy / u_resolution) * 2.0 - 1.0;
  float aspect = u_resolution.x / u_resolution.y;
  uv.x *= aspect;

  float orbit = u_time * u_cameraOrbitSpeed;
  float beatPulse = u_beat * u_beatKick;
  float radius = u_cameraRadius + u_bass * 0.8 * u_audioReact + beatPulse * 0.25;
  float height = u_cameraHeight + sin(u_time * 0.6) * 0.35 * u_audioReact;

  vec3 ro = vec3(sin(orbit) * radius, height, cos(orbit) * radius);
  vec3 target = vec3(0.0, 0.0, 0.0);
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 rd = normalize(forward + uv.x * right * 1.1 + uv.y * up * 1.1);

  float totalDist = 0.0;
  float hit = 0.0;
  int stepIndex = 0;

  for (int i = 0; i < 160; i += 1) {
    if (i >= u_steps) {
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

  vec3 bg = mix(vec3(0.02, 0.02, 0.04), vec3(0.1, 0.1, 0.2), gl_FragCoord.y / u_resolution.y);
  vec3 color = bg;

  if (hit > 0.5) {
    vec3 pos = ro + rd * totalDist;
    vec3 normal = estimateNormal(pos);
    vec3 lightDir = normalize(vec3(0.4, 0.7, -0.5));
    float diffuse = max(dot(normal, lightDir), 0.0);
    float ambient = 0.15;
    vec3 halfDir = normalize(lightDir - rd);
    float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
    float rim = pow(1.0 - max(dot(normal, -rd), 0.0), 3.0);

    float t = float(stepIndex) / float(max(u_steps, 1));
    float palettePhase = t + u_time * u_paletteSpeed + beatPulse * 0.2;
    vec3 baseColor = palette(palettePhase);
    color = baseColor * (diffuse + ambient) + spec * 0.8 + rim * 0.35;

    float fog = exp(-0.08 * totalDist * totalDist);
    color = mix(bg, color, fog);
  }

  fragColor = vec4(color, 1.0);
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

const QUALITY_STEPS: Record<number, number> = {
  1: 72,
  2: 96,
  3: 128
};

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
): WebGLUniformPayload => {
  const qualityIndex = clamp(Math.round(params.quality * 2), 1, 3);
  const steps = QUALITY_STEPS[qualityIndex] ?? QUALITY_STEPS[2];

  return {
    time,
    resolution: [width, height],
    rms: clamp(audio.rms, 0, 1),
    bass: clamp(audio.bass, 0, 1),
    mid: clamp(audio.mid, 0, 1),
    treble: clamp(audio.treble, 0, 1),
    beat: audio.beat ? 1 : 0,
    beatStrength: clamp(audio.beatStrength, 0, 1),
    warp: 0,
    hueShift: 0,
    exposure: 1,
    seed: 0,
    steps,
    quality: params.quality,
    mode: FRACTAL_MODES[params.fractal],
    cameraRadius: params.cameraRadius,
    cameraHeight: params.cameraHeight,
    cameraOrbitSpeed: params.cameraOrbitSpeed,
    paletteSpeed: params.paletteSpeed,
    audioReact: params.audioReact,
    beatKick: params.beatKick,
    fractalScale: params.fractalScale
  };
};

export class RaymarchFractalEffect implements Effect {
  private webgl: WebGLEffectBase | null = null;
  private fallback = new FractalEffect();
  private warned = false;

  constructor() {
    this.webgl = new WebGLEffectBase(FRAGMENT_SHADER_SOURCE, "raymarch_fractal");
  }

  render(context: EffectRenderContext): void {
    const params = normalizeRaymarchFractalParams(context.params as Record<string, unknown>);
    const uniforms = buildRaymarchFractalUniforms(context.time, context.width, context.height, context.audio, params);
    const qualityIndex = clamp(Math.round(params.quality * 2), 1, 3);

    const rendered = this.webgl?.renderToCanvas2D(
      context.ctx,
      context.width,
      context.height,
      uniforms,
      qualityIndex
    );

    if (rendered) {
      this.warned = false;
      return;
    }

    if (!this.warned) {
      console.warn("[raymarch_fractal] WebGL2 unavailable or failed, falling back to fractal effect.");
      this.warned = true;
    }
    this.fallback.render(context);
  }

  reset(): void {
    this.warned = false;
  }
}
