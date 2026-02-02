export const NEON_ALLEY_FRAGMENT_SHADER = `#version 300 es
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

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

mat2 rotate(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float rectGlow(vec2 p, vec2 size) {
  vec2 d = abs(p) - size;
  float dist = max(d.x, d.y);
  return 1.0 - smoothstep(0.0, 0.05, dist);
}

vec3 signPalette(float seed, float treble) {
  vec3 neonA = mix(vec3(0.1, 1.2, 1.4), vec3(1.2, 0.2, 1.0), seed);
  vec3 neonB = mix(vec3(1.3, 0.9, 0.2), vec3(0.2, 1.0, 0.7), 0.5 + 0.5 * treble);
  return mix(neonA, neonB, 0.35 + 0.25 * sin(seed * 6.0));
}

vec3 neonSign(vec2 wallPos, float side, float time, float bass, float treble) {
  float spacing = 5.5;
  float cell = floor((wallPos.x + side * 1.7) / spacing);
  float localZ = mod(wallPos.x + side * 1.7, spacing) - spacing * 0.5;
  float seed = hash11(cell + side * 37.0 + u_seed);
  float height = 1.1 + seed * 1.2;
  vec2 size = vec2(0.9 + seed * 0.8, 0.28 + seed * 0.45);
  vec2 p = vec2(localZ, wallPos.y - height);

  float core = rectGlow(p, size);
  float glow = smoothstep(0.9, 0.0, length(p / size));
  float line = 0.6 + 0.4 * sin(p.y * 12.0 + time * 3.5 + seed * 5.0);
  float flicker = 0.65 + 0.35 * abs(sin(time * 6.0 + seed * 10.0 + bass * 4.0));

  vec3 color = signPalette(seed, treble);
  vec3 sign = color * (core * (0.7 + 0.3 * line) + glow * 0.75);
  sign *= flicker;

  float cell2 = floor((wallPos.x + side * 2.3 + 2.5) / 7.0);
  float localZ2 = mod(wallPos.x + side * 2.3 + 2.5, 7.0) - 3.5;
  float seed2 = hash11(cell2 + 11.2 + u_seed);
  vec2 p2 = vec2(localZ2, wallPos.y - (0.7 + seed2 * 0.8));
  vec2 size2 = vec2(0.55 + seed2 * 0.4, 0.2 + seed2 * 0.2);
  float core2 = rectGlow(p2, size2);
  float glow2 = smoothstep(0.9, 0.0, length(p2 / size2));
  vec3 color2 = mix(vec3(0.2, 0.9, 1.2), vec3(1.1, 0.3, 0.5), seed2);
  sign += color2 * (core2 + glow2 * 0.6) * (0.7 + 0.3 * treble);

  return sign;
}

float rainLayer(vec2 uv, float time, float density, float speed, float slant) {
  vec2 grid = vec2(uv.x * 30.0 + slant, uv.y * 55.0 + time * speed);
  vec2 cell = floor(grid);
  float rnd = hash12(cell + u_seed);
  float drop = step(1.0 - density, rnd);
  float streak = 1.0 - abs(fract(grid.y) - 0.5) * 2.0;
  streak = smoothstep(0.1, 0.9, streak);
  float width = smoothstep(0.0, 0.015, abs(fract(grid.x + rnd * 3.0) - 0.5));
  return drop * streak * (1.0 - width);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  float time = u_time;
  float speed = 1.1 + u_mid * 0.2;
  float bob = sin(time * 0.7) * 0.04;
  float shake = u_rms * 0.03;

  vec3 ro = vec3(sin(time * 0.35) * 0.2 + shake * sin(time * 7.0), 1.1 + bob, time * speed);

  vec3 rd = normalize(vec3(uv.x, uv.y + 0.05 + shake * 0.5, 1.4));
  rd.yz = rotate(-0.18 + sin(time * 0.2) * 0.02) * rd.yz;
  rd.xz = rotate(sin(time * 0.3) * 0.05) * rd.xz;

  float wallX = 2.2;
  float wallHeight = 3.4;
  float tGround = -1.0;
  if (rd.y < -0.001) {
    tGround = (ro.y) / -rd.y;
  }

  float tLeft = -1.0;
  if (rd.x < -0.001) {
    float t = (-wallX - ro.x) / rd.x;
    vec3 p = ro + rd * t;
    if (t > 0.0 && p.y > 0.0 && p.y < wallHeight) {
      tLeft = t;
    }
  }

  float tRight = -1.0;
  if (rd.x > 0.001) {
    float t = (wallX - ro.x) / rd.x;
    vec3 p = ro + rd * t;
    if (t > 0.0 && p.y > 0.0 && p.y < wallHeight) {
      tRight = t;
    }
  }

  float tMin = 1e6;
  int hit = -1;
  if (tGround > 0.0 && tGround < tMin) {
    tMin = tGround;
    hit = 0;
  }
  if (tLeft > 0.0 && tLeft < tMin) {
    tMin = tLeft;
    hit = 1;
  }
  if (tRight > 0.0 && tRight < tMin) {
    tMin = tRight;
    hit = 2;
  }

  vec3 color = vec3(0.01, 0.02, 0.05);
  float fog = 0.0;
  if (hit >= 0) {
    vec3 pos = ro + rd * tMin;
    float depth = max(0.0, pos.z - ro.z);
    fog = clamp(exp(-depth * 0.08), 0.0, 1.0);

    if (hit == 0) {
      float grid = smoothstep(0.0, 0.02, abs(fract(pos.z * 0.25) - 0.5));
      float puddle = smoothstep(0.3, 0.7, noise2(pos.xz * 0.8 + u_seed + float(u_steps) * 0.01));
      vec3 base = vec3(0.02, 0.03, 0.06) + grid * 0.05;
      vec3 leftGlow = neonSign(vec2(pos.z, 1.2), -1.0, time, u_bass, u_treble);
      vec3 rightGlow = neonSign(vec2(pos.z, 1.4), 1.0, time, u_bass, u_treble);
      float centerMask = pow(clamp(1.0 - abs(pos.x) / wallX, 0.0, 1.0), 1.6);
      vec3 reflection = (leftGlow + rightGlow) * (0.2 + 0.7 * puddle) * centerMask;
      float smear = 0.6 + 0.4 * noise2(pos.xz * 1.4 + time * 0.2 + float(u_steps) * 0.005);
      reflection *= smear;
      color = base + reflection;
    } else {
      float side = hit == 1 ? -1.0 : 1.0;
      vec3 wallBase = vec3(0.02, 0.02, 0.06);
      vec3 neon = neonSign(vec2(pos.z, pos.y), side, time, u_bass, u_treble);
      float grime = noise2(pos.yz * 0.6 + side * 4.0);
      color = wallBase + neon + grime * 0.05;
    }

    color *= 0.6 + 0.6 * fog;
    color += vec3(0.02, 0.03, 0.05) * (1.0 - fog);
  }

  vec2 rainUv = uv;
  float qualityBoost = mix(0.85, 1.15, clamp(u_quality / 3.0, 0.0, 1.0));
  float density = mix(0.12, 0.42, clamp(u_rms, 0.0, 1.0)) * qualityBoost;
  float slant = sin(time * 0.3) * 0.6;
  float rain = 0.0;
  rain += rainLayer(rainUv, time, density, 3.5, slant) * 0.6;
  rain += rainLayer(rainUv * 1.2, time * 1.1, density * 0.8, 4.2, slant * 1.3) * 0.5;
  rain += rainLayer(rainUv * 1.5, time * 0.9, density * 0.6, 5.2, slant * 1.6) * 0.4;

  vec3 rainColor = vec3(0.6, 0.7, 0.8) * rain;
  color = mix(color, color + rainColor, 0.65);

  float bassPulse = 0.4 + 0.6 * (u_bass + u_beatStrength * 0.5);
  color *= 0.9 + 0.25 * bassPulse;

  float vignette = smoothstep(1.2, 0.2, length(uv));
  color *= vignette;

  color = pow(color * u_exposure, vec3(0.9));
  fragColor = vec4(color, 1.0);
}
`;
