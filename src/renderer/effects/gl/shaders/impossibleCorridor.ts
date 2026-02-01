export const VERT = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAG = `#version 300 es
precision highp float;

out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rms;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_beat;
uniform float u_beatStrength;
uniform float u_warp;
uniform float u_hueShift;
uniform float u_exposure;
uniform float u_seed;
uniform float u_quality;
uniform float u_aspect;

in vec2 v_uv;

const int MAX_STEPS = 140;
const float MAX_DIST = 40.0;

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

vec3 opRep(vec3 p, vec3 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}

vec3 fold(vec3 p, float k) {
  p = abs(p);
  p.xy = rot(0.45 + p.z * 0.15) * p.xy;
  return p - vec3(k);
}

float mengerCut(vec3 p) {
  float c1 = sdBox(p, vec3(0.22, 1.6, 0.22));
  float c2 = sdBox(p, vec3(1.6, 0.22, 0.22));
  float c3 = sdBox(p, vec3(0.22, 0.22, 1.6));
  return min(c1, min(c2, c3));
}

float mapScene(vec3 p) {
  float bass = clamp(u_bass, 0.0, 1.0);
  float warp = u_warp * (0.6 + bass * 0.9);
  float twist = sin(p.z * 0.22 + u_time * 0.7 + u_seed) * warp;
  p.xy = rot(twist) * p.xy;

  float breath = 0.12 + 0.25 * sin(u_time * 2.1 + p.z * 0.35) * (0.4 + bass);
  vec3 cell = opRep(p, vec3(4.0, 4.0, 6.0));
  vec3 folded = fold(cell, 0.85 + breath);

  float corridor = sdBox(folded, vec3(1.2 + breath, 0.9 + breath, 2.6));
  float voids = mengerCut(folded);
  float carved = max(corridor, -voids);

  float pillar = sdCylinder(cell, 0.35 + 0.15 * sin(u_time + cell.z), 2.4);
  float structure = min(carved, pillar);

  float ripple = sin(dot(p, vec3(22.0, 19.0, 17.0)) + u_time * 12.0) * 0.0035 * u_treble;
  return structure + ripple;
}

vec3 estimateNormal(vec3 p) {
  float eps = 0.0015;
  float k = clamp(u_quality, 1.0, 3.0);
  eps *= 1.6 - 0.2 * k;
  vec2 e = vec2(eps, 0.0);
  return normalize(vec3(
    mapScene(p + e.xyy) - mapScene(p - e.xyy),
    mapScene(p + e.yxy) - mapScene(p - e.yxy),
    mapScene(p + e.yyx) - mapScene(p - e.yyx)
  ));
}

vec3 palette(float t, float hueShift) {
  vec3 a = vec3(0.45, 0.42, 0.5);
  vec3 b = vec3(0.45, 0.4, 0.35);
  vec3 c = vec3(1.0, 0.9, 0.8);
  vec3 d = vec3(0.1 + hueShift, 0.3 + hueShift, 0.5 + hueShift);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy / max(u_resolution, vec2(1.0))) * 2.0 - 1.0;
  uv.x *= max(u_aspect, 0.1);

  float beatKick = u_beatStrength * 0.22;
  vec2 kick = vec2(sin(u_time * 4.1), cos(u_time * 3.7)) * beatKick;

  vec3 ro = vec3(kick, u_time * 4.2);
  vec3 rd = normalize(vec3(uv, 1.35));

  float fogDensity = 0.06 + u_mid * 0.08;
  int steps = int(mix(56.0, 120.0, clamp((u_quality - 1.0) / 2.0, 0.0, 1.0)));

  float t = 0.0;
  float hit = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    if (i >= steps) {
      break;
    }
    vec3 p = ro + rd * t;
    float d = mapScene(p);
    if (d < 0.0015) {
      hit = 1.0;
      break;
    }
    t += d * 0.9;
    if (t > MAX_DIST) {
      break;
    }
  }

  vec3 color = vec3(0.02, 0.02, 0.04);
  if (hit > 0.5) {
    vec3 p = ro + rd * t;
    vec3 n = estimateNormal(p);
    vec3 lightDir = normalize(vec3(0.6, 0.7, 0.4));
    float diff = clamp(dot(n, lightDir), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(-lightDir, n), -rd), 0.0, 1.0), 32.0);
    float rim = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 2.0);

    float shade = diff * 0.8 + rim * 0.6 + spec * 0.7;
    float shimmer = 0.25 + u_treble * 0.5;
    vec3 base = palette(0.35 + t * 0.07 + u_treble * 0.4, u_hueShift);
    color = base * shade * shimmer;

    float fog = exp(-t * fogDensity);
    vec3 fogColor = vec3(0.05, 0.05, 0.09) + base * 0.1;
    color = mix(fogColor, color, fog);
  }

  float flash = u_beatStrength * 0.8 + u_beat * 0.35;
  color += vec3(flash * 0.5, flash * 0.3, flash * 0.2);
  color *= u_exposure;
  color = vec3(1.0) - exp(-color);

  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
