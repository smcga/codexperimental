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
uniform int u_steps;
uniform float u_quality;
uniform float u_aspect;

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 opRep(vec3 p, vec3 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}

vec3 fold(vec3 p) {
  p = abs(p);
  p.xy *= rot(0.7);
  p.yz *= rot(0.5);
  p.xz *= rot(0.4);
  p -= vec3(0.3, 0.15, 0.25);
  return p;
}

float mengerCut(vec3 p) {
  vec3 q = abs(p);
  float cross = max(min(q.x, q.y), min(q.y, q.z));
  float voids = max(cross - 0.18, max(q.x - 0.45, max(q.y - 0.45, q.z - 0.45)));
  return voids;
}

float mapScene(vec3 p, float pulse) {
  vec3 q = p;
  float twist = sin(q.z * 0.3 + u_time * 0.5) * (0.35 + u_bass * 0.6) * u_warp;
  q.xy *= rot(twist + u_time * 0.08);
  q.xz *= rot(0.12 * sin(q.z * 0.2 + u_time));

  q = opRep(q, vec3(2.2, 2.2, 3.6));
  q = fold(q);

  float corridor = sdBox(q, vec3(0.7 + pulse, 0.7 + pulse, 1.6));
  float carve = mengerCut(q);
  float detail = sin(q.x * 8.0 + q.y * 6.0 + q.z * 5.0 + u_time * 1.8) * 0.05 * (0.3 + u_treble);

  return max(corridor, -carve) + detail;
}

vec3 palette(float t) {
  vec3 a = vec3(0.4, 0.2, 0.5);
  vec3 b = vec3(0.5, 0.4, 0.4);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.2, 0.35, 0.6);
  return a + b * cos(6.28318 * (c * t + d + u_hueShift));
}

vec3 estimateNormal(vec3 p, float eps) {
  vec2 e = vec2(eps, 0.0);
  float d1 = mapScene(p + vec3(e.x, e.y, e.y), 0.0);
  float d2 = mapScene(p - vec3(e.x, e.y, e.y), 0.0);
  float d3 = mapScene(p + vec3(e.y, e.x, e.y), 0.0);
  float d4 = mapScene(p - vec3(e.y, e.x, e.y), 0.0);
  float d5 = mapScene(p + vec3(e.y, e.y, e.x), 0.0);
  float d6 = mapScene(p - vec3(e.y, e.y, e.x), 0.0);
  vec3 n = vec3(d1 - d2, d3 - d4, d5 - d6);
  return normalize(n);
}

void main() {
  vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
  float aspect = max(u_aspect, 0.1);
  uv.x *= aspect;

  float time = u_time;
  float beatKick = u_beatStrength * 0.4;
  float pulse = u_bass * 0.25 + u_rms * 0.1;

  vec3 ro = vec3(0.0, 0.0, time * 2.6 + u_seed);
  ro.xy += vec2(sin(time * 0.9), cos(time * 0.7)) * 0.25;
  ro.xy += vec2(beatKick, -beatKick) * 0.3;

  vec3 rd = normalize(vec3(uv, 1.4));
  rd.xy *= rot(sin(time * 0.3 + u_seed) * 0.35 + u_bass * 0.35);
  rd.xz *= rot(0.12 * sin(time * 0.4 + u_seed));

  float t = 0.0;
  float maxDist = 40.0;
  float eps = 0.0015 * mix(1.4, 0.8, clamp(u_quality / 3.0, 0.0, 1.0));
  vec3 color = vec3(0.0);
  float fog = 0.0;

  for (int i = 0; i < 140; i += 1) {
    if (i >= u_steps) {
      break;
    }
    vec3 p = ro + rd * t;
    float d = mapScene(p, pulse);
    if (d < eps || t > maxDist) {
      vec3 n = estimateNormal(p, eps * 2.0);
      vec3 lightDir = normalize(vec3(0.6, 0.4, -0.5));
      float diff = clamp(dot(n, lightDir), 0.0, 1.0);
      float rim = pow(clamp(1.0 - dot(n, -rd), 0.0, 1.0), 2.0);
      float spec = pow(clamp(dot(reflect(-lightDir, n), -rd), 0.0, 1.0), 18.0);

      float glow = exp(-abs(d) * 25.0);
      vec3 base = palette(t * 0.06 + u_mid * 0.2 + u_treble * 0.15);
      color = base * (0.4 + diff * 0.8) + vec3(spec) * 0.5 + rim * vec3(0.6, 0.8, 1.0);
      color += glow * (0.2 + u_beatStrength * 0.6);
      break;
    }
    float density = exp(-d * 6.0);
    vec3 haze = palette(t * 0.04 + u_treble * 0.2);
    color += haze * density * 0.035;
    fog += density * 0.03;
    t += d * 0.9;
  }

  float flash = u_beat * 0.5 + u_beatStrength * 0.6;
  color += fog * 0.2;
  color *= 1.0 + flash;
  color = pow(max(color * u_exposure, 0.0), vec3(0.9));

  fragColor = vec4(color, 1.0);
}
`;
