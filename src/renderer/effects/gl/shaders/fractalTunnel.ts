export const FRACTAL_TUNNEL_FRAGMENT_SHADER = `#version 300 es
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

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float mapTunnel(vec3 p, float pulse) {
  vec3 q = p;
  q.xy *= rot(q.z * 0.15 + u_time * 0.2 + u_bass * 1.2);
  q.xy += vec2(sin(q.z * 0.6), cos(q.z * 0.5)) * 0.25 * u_warp;

  float scale = 1.0;
  for (int i = 0; i < 3; i += 1) {
    q = abs(q) - 0.35;
    q.xy *= rot(0.6 + float(i) * 0.4 + u_time * 0.05);
    scale *= 1.35;
    q *= 1.3;
  }

  float tunnelRadius = 0.6 + pulse + 0.1 * sin(q.z * 0.7 + u_time * 1.4);
  float tunnel = abs(length(q.xy) - tunnelRadius);

  float ripples = sin(q.z * 1.5 + q.x * 0.8 + q.y * 0.6) * 0.08;
  float grain = (hash11(dot(q.xy, vec2(12.7, 8.9)) + u_seed) - 0.5) * 0.06;
  return tunnel + ripples + grain * (0.6 + u_treble * 1.4);
}

vec3 palette(float t) {
  vec3 a = vec3(0.35, 0.2, 0.4);
  vec3 b = vec3(0.6, 0.4, 0.3);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.4, 0.2, 0.7);
  return a + b * cos(6.28318 * (c * t + d + u_hueShift));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  float t = u_time * 0.85;
  float beatKick = u_beatStrength * 0.45;
  float bassPulse = u_bass * 0.35 + u_rms * 0.12;

  vec3 ro = vec3(0.0, 0.0, t * 2.0);
  ro.xy += vec2(sin(t * 0.7 + u_seed), cos(t * 0.6 + u_seed * 1.3)) * 0.4;
  ro.xy += vec2(beatKick, -beatKick) * 0.3;

  vec3 rd = normalize(vec3(uv, 1.6));
  rd.xy *= rot(sin(t * 0.4 + u_seed) * 0.4 + u_bass * 0.6);
  rd.xy += vec2(sin(t * 0.3), cos(t * 0.25)) * 0.05 * u_warp;

  float dist = 0.0;
  vec3 color = vec3(0.0);
  float fog = 0.0;

  for (int i = 0; i < 112; i += 1) {
    if (i >= u_steps) {
      break;
    }
    vec3 p = ro + rd * dist;
    float d = mapTunnel(p, bassPulse);
    float density = exp(-d * 6.0);
    float shimmer = sin(dist * 4.0 + u_time * 6.0) * u_treble * 0.2;
    vec3 glow = palette(dist * 0.08 + shimmer + u_mid * 0.2);
    color += glow * density * (0.06 + u_bass * 0.2 + u_beatStrength * 0.35);
    fog += density * 0.04;
    if (d < 0.002 || dist > 12.0) {
      break;
    }
    dist += d * (0.6 + u_bass * 0.2);
  }

  float flash = u_beat * 0.5 + u_beatStrength * 0.4;
  color *= 1.0 + flash;
  color = mix(color, vec3(fog), 0.2);
  color = pow(color * u_exposure, vec3(0.9));

  fragColor = vec4(color, 1.0);
}
`;
