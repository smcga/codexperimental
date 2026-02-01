export const FRACTAL_TUNNEL_FRAGMENT = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rms;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_beat;
uniform float u_beatStrength;
uniform float u_quality;
uniform float u_warp;
uniform float u_hueShift;
uniform float u_exposure;
uniform float u_seed;

float hash1(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(27.1, 61.7, 12.4))) * 43758.5453);
}

vec3 palette(float t) {
  vec3 a = vec3(0.55, 0.2, 0.9);
  vec3 b = vec3(0.45, 0.4, 0.2);
  vec3 c = vec3(1.0, 0.9, 0.7);
  vec3 d = vec3(0.2, 0.2, 0.35) + u_hueShift;
  return a + b * cos(6.28318 * (c * t + d));
}

float map(vec3 p) {
  float bassPulse = 0.35 * u_bass + 0.1 * u_beatStrength;
  float radius = 1.25 + bassPulse;
  vec2 warp = vec2(
    sin(p.z * 0.5 + u_time * 0.8 + u_seed) * 0.4,
    cos(p.z * 0.7 + u_time * 0.6 - u_seed) * 0.4
  );
  p.xy += warp * u_warp;
  float tunnel = length(p.xy) - radius;

  vec3 q = p;
  float fold = 0.0;
  for (int i = 0; i < 4; i += 1) {
    q = abs(q) - 0.8;
    q = q * 1.35 + vec3(0.2, -0.15, 0.1);
    fold += exp(-length(q) * 1.4);
  }
  float detail = (0.6 - fold) * 0.9;
  return min(tunnel, detail);
}

void main() {
  vec2 uv = (v_uv * 2.0 - 1.0);
  uv.x *= u_resolution.x / u_resolution.y;

  float beatKick = u_beatStrength * 0.8 + u_beat * 0.4;
  float swirl = (u_bass * 0.6 + beatKick) * 0.8;
  float time = u_time * 0.75;

  vec3 ro = vec3(0.0, 0.0, -4.0 + beatKick * 0.4);
  vec3 rd = normalize(vec3(uv, 1.5));
  float angle = time * 0.35 + swirl;
  float s = sin(angle);
  float c = cos(angle);
  rd.xy = mat2(c, -s, s, c) * rd.xy;

  int steps = u_quality < 1.5 ? 48 : (u_quality < 2.5 ? 80 : 112);
  float t = 0.0;
  float glow = 0.0;
  float fog = 0.0;
  for (int i = 0; i < 112; i += 1) {
    if (i >= steps) {
      break;
    }
    vec3 p = ro + rd * t;
    p.z += time * 2.8;
    float d = map(p);
    float thickness = exp(-d * 3.0);
    float shimmer = u_treble * 0.45 + hash(p * 4.0 + u_seed) * u_treble * 0.5;
    glow += thickness * (0.15 + shimmer);
    fog += exp(-t * 0.08) * 0.02;
    t += max(0.02, abs(d) * 0.65);
    if (t > 18.0) {
      break;
    }
  }

  float pulse = smoothstep(0.0, 1.0, u_bass) * 0.4 + beatKick * 0.6;
  float luminance = glow * (1.4 + pulse) + fog;
  vec3 color = palette(time * 0.08 + u_mid * 0.35 + luminance * 0.2);
  color *= luminance * (1.0 + u_rms * 0.4);
  color += vec3(0.15, 0.1, 0.25) * beatKick;
  color *= u_exposure;
  outColor = vec4(color, 1.0);
}
`;
