export const IMPOSSIBLE_CORRIDOR_VERTEX_SHADER = `#version 300 es
precision highp float;

const vec2 positions[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);

void main() {
  gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
}
`;

export const IMPOSSIBLE_CORRIDOR_FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

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

const float MAX_DIST = 40.0;

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

vec3 opRep(vec3 p, vec3 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}

vec3 fold(vec3 p, float amount) {
  p = abs(p);
  p.xy = rot(0.6 + amount) * p.xy;
  p.xz = rot(0.45 - amount * 0.4) * p.xz;
  p -= 0.35 + amount * 0.2;
  return p;
}

float mengerCut(vec3 p, float size) {
  vec3 q = abs(p);
  float cut = max(min(q.x, q.y), min(max(q.x, q.y), q.z));
  return cut - size;
}

float mapScene(vec3 p) {
  float warp = clamp(u_warp + u_bass * 0.6, 0.0, 2.0);
  float pulse = 1.0 + sin(u_time * 1.4 + u_bass * 3.0) * (0.08 + u_bass * 0.2);
  vec3 q = p;
  q.xy = rot(sin(q.z * 0.22 + u_time * 0.2) * (0.6 + warp * 0.6)) * q.xy;
  q.xy += vec2(sin(q.z * 0.3 + u_time), cos(q.z * 0.26 + u_time * 0.8)) * 0.15 * warp;

  float corridorOuter = sdBox(vec3(q.x, q.y, 0.0), vec3(1.4 * pulse, 1.2 * pulse, 1.0));
  float corridorInner = sdBox(vec3(q.x, q.y, 0.0), vec3(0.65 + u_bass * 0.2, 0.55 + u_bass * 0.2, 1.0));
  float corridor = max(corridorOuter, -corridorInner);

  vec3 cell = opRep(q, vec3(2.6, 2.2, 3.6));
  cell = fold(cell, warp * 0.35);
  float box = sdBox(cell, vec3(0.45));
  float carve = mengerCut(cell, 0.18 + 0.06 * u_bass);
  float menger = max(box, -carve);

  vec3 ribs = opRep(q + vec3(0.0, 0.0, u_time * 0.3), vec3(1.8, 1.8, 2.4));
  float ribBox = sdBox(ribs, vec3(0.25, 0.25, 0.45));

  float detail = min(menger, ribBox);
  float ripple = sin(q.z * 3.2 + q.x * 2.8 + q.y * 2.2) * (0.015 + u_treble * 0.04);
  return min(corridor, detail) + ripple;
}

vec3 palette(float t) {
  vec3 a = vec3(0.25, 0.2, 0.3);
  vec3 b = vec3(0.55, 0.45, 0.35);
  vec3 c = vec3(0.9, 0.9, 1.0);
  vec3 d = vec3(0.15, 0.35, 0.65);
  return a + b * cos(6.28318 * (c * t + d + u_hueShift));
}

vec3 calcNormal(vec3 p, float eps) {
  vec2 e = vec2(eps, 0.0);
  float dx = mapScene(p + vec3(e.x, e.y, e.y)) - mapScene(p - vec3(e.x, e.y, e.y));
  float dy = mapScene(p + vec3(e.y, e.x, e.y)) - mapScene(p - vec3(e.y, e.x, e.y));
  float dz = mapScene(p + vec3(e.y, e.y, e.x)) - mapScene(p - vec3(e.y, e.y, e.x));
  return normalize(vec3(dx, dy, dz));
}

void main() {
  float aspect = u_aspect > 0.0 ? u_aspect : (u_resolution.x / max(1.0, u_resolution.y));
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv.x *= aspect;

  float quality = clamp(u_quality, 1.0, 3.0);
  int steps = quality < 1.5 ? 56 : (quality < 2.5 ? 88 : 120);
  float scale = quality < 1.5 ? 0.6 : (quality < 2.5 ? 0.8 : 1.0);
  float eps = 0.0015 * scale;

  float t = u_time;
  float travel = t * 3.2;
  float kick = u_beatStrength;
  vec3 ro = vec3(0.0, 0.0, travel);
  ro.xy += vec2(sin(t * 0.7 + u_seed), cos(t * 0.6 + u_seed * 1.3)) * (0.25 + u_bass * 0.35);
  ro.xy += vec2(sin(t * 9.0), cos(t * 8.0)) * kick * 0.35;

  vec3 rd = normalize(vec3(uv, 1.6));
  rd.xy = rot(sin(t * 0.35 + u_seed) * 0.4 + u_bass * 0.5) * rd.xy;
  rd.xy += vec2(sin(t * 0.3), cos(t * 0.24)) * 0.05 * u_warp;

  float dist = 0.0;
  vec3 color = vec3(0.0);
  float fogAccum = 0.0;

  for (int i = 0; i < 120; i += 1) {
    if (i >= steps) {
      break;
    }
    vec3 p = ro + rd * dist;
    float d = mapScene(p);
    if (d < eps || dist > MAX_DIST) {
      break;
    }
    float density = exp(-d * 6.0);
    vec3 glow = palette(dist * 0.06 + u_treble * 0.4 + u_mid * 0.25);
    color += glow * density * (0.045 + u_bass * 0.2 + kick * 0.3);
    fogAccum += density * 0.03;
    dist += d * (0.75 + u_bass * 0.2);
  }

  vec3 hitPos = ro + rd * dist;
  float surface = mapScene(hitPos);
  if (surface < 0.02 && dist < MAX_DIST) {
    vec3 normal = calcNormal(hitPos, eps * 2.0);
    vec3 lightDir = normalize(vec3(0.4, 0.6, -0.3));
    float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
    float rim = pow(clamp(1.0 + dot(normal, rd), 0.0, 1.0), 2.0);
    vec3 base = palette(dist * 0.08 + u_hueShift);
    float spec = pow(clamp(dot(reflect(-lightDir, normal), -rd), 0.0, 1.0), 24.0);
    color += base * diff * 0.5 + spec * vec3(1.0) * (0.2 + u_treble * 0.5) + rim * 0.2;
  }

  float fog = exp(-dist * 0.08) + fogAccum * 0.6;
  color = mix(vec3(0.04, 0.03, 0.06), color, clamp(fog, 0.0, 1.0));
  float flash = u_beat * 0.45 + kick * 0.35 + u_rms * 0.15;
  color *= 1.0 + flash;
  color = pow(color * u_exposure, vec3(0.92));

  fragColor = vec4(color, 1.0);
}
`;
