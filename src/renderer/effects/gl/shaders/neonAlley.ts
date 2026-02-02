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
uniform float u_quality;
uniform float u_aspect;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(27.1, 81.7))) * 43758.5453123);
}

vec3 neonPalette(float t) {
  float band = floor(fract(t) * 3.0);
  vec3 c1 = vec3(0.1, 0.8, 1.6);
  vec3 c2 = vec3(1.4, 0.2, 1.2);
  vec3 c3 = vec3(1.6, 1.2, 0.3);
  vec3 color = mix(c1, c2, step(1.0, band));
  color = mix(color, c3, step(2.0, band));
  float pulse = 0.7 + 0.3 * sin(u_time * 1.2 + t * 6.283 + u_hueShift * 6.0);
  return color * pulse;
}

float rectMask(vec2 uv, vec2 center, vec2 size) {
  vec2 d = abs(uv - center) - size * 0.5;
  float dist = max(d.x, d.y);
  return 1.0 - smoothstep(0.0, 0.08, dist);
}

vec3 neonSign(vec2 wallUV, float side) {
  float spacing = 3.2;
  float cell = floor(wallUV.x / spacing);
  float localZ = fract(wallUV.x / spacing) * spacing - spacing * 0.5;
  float seed = cell + side * 7.0 + u_seed * 0.17;
  float yCenter = mix(0.7, 2.2, hash11(seed + 1.3));
  vec2 size = vec2(mix(0.8, 1.6, hash11(seed + 2.7)), mix(0.3, 0.8, hash11(seed + 4.2)));
  float base = rectMask(vec2(localZ, wallUV.y), vec2(0.0, yCenter), size);
  float stripe = 0.5 + 0.5 * sin(localZ * 6.0 + wallUV.y * 4.0 + u_time * 2.0 + seed);
  float flicker = 0.65 + 0.35 * sin(u_time * 7.0 + seed * 3.1 + u_bass * 6.0);
  float shimmer = 0.5 + 0.5 * sin(u_time * 9.0 + wallUV.y * 8.0 + u_treble * 4.0);
  float intensity = base * mix(0.6, 1.0, stripe) * mix(0.7, 1.0, shimmer) * flicker;
  vec3 color = neonPalette(hash11(seed + 5.6) + u_hueShift);
  return color * intensity;
}

float rainLayer(vec2 uv, float time, float density) {
  vec2 grid = vec2(70.0, 140.0) * mix(0.7, 1.3, density);
  vec2 pos = uv * grid + vec2(0.0, time * 18.0);
  vec2 cell = floor(pos);
  vec2 f = fract(pos);
  float rnd = hash21(cell);
  float spawn = step(rnd, density);
  float line = smoothstep(0.06, 0.0, abs(f.x - 0.5));
  float fall = smoothstep(1.0, 0.2, f.y);
  return spawn * line * fall;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  centered.x *= u_aspect;

  float speed = max(0.15, u_warp);
  float time = u_time * speed;
  vec2 shake = vec2(sin(u_time * 3.2), cos(u_time * 2.7)) * (0.02 + u_rms * 0.04);
  centered += shake;

  vec3 ro = vec3(0.0, 1.2, time * 2.4);
  vec3 rd = normalize(vec3(centered, 1.6));

  float wallX = 2.0;
  float wallHeight = 3.0;
  float tMin = 1e9;
  vec3 color = vec3(0.0);

  float tGround = (0.0 - ro.y) / rd.y;
  if (tGround > 0.0) {
    vec3 p = ro + rd * tGround;
    if (tGround < tMin) {
      tMin = tGround;
      float lane = smoothstep(0.05, 0.0, abs(fract(p.z * 0.5) - 0.5));
      float puddle = smoothstep(0.3, 1.0, hash21(p.xz * 0.9 + u_seed));
      vec3 base = vec3(0.02, 0.03, 0.05) + lane * vec3(0.03, 0.05, 0.08);

      float distLeft = abs(p.x + wallX);
      float distRight = abs(p.x - wallX);
      float reflectLeft = exp(-distLeft * 2.0);
      float reflectRight = exp(-distRight * 2.0);

      vec3 signLeft = neonSign(vec2(p.z, 1.2 + 0.3 * sin(p.z * 0.3)), -1.0);
      vec3 signRight = neonSign(vec2(p.z, 1.0 + 0.35 * cos(p.z * 0.25)), 1.0);
      vec3 reflections = signLeft * reflectLeft + signRight * reflectRight;
      reflections *= mix(0.4, 1.0, hash21(p.xz * 2.3 + u_time * 0.1));
      reflections *= mix(0.5, 1.2, puddle);
      reflections *= 0.8 + u_rms * 0.6;

      color = base + reflections * 0.6;
    }
  }

  float tLeft = (-wallX - ro.x) / rd.x;
  if (tLeft > 0.0) {
    vec3 p = ro + rd * tLeft;
    if (p.y >= 0.0 && p.y <= wallHeight && tLeft < tMin) {
      tMin = tLeft;
      vec3 base = vec3(0.02, 0.02, 0.05) + vec3(0.01, 0.02, 0.03) * p.y;
      vec3 sign = neonSign(vec2(p.z, p.y), -1.0);
      color = base + sign;
    }
  }

  float tRight = (wallX - ro.x) / rd.x;
  if (tRight > 0.0) {
    vec3 p = ro + rd * tRight;
    if (p.y >= 0.0 && p.y <= wallHeight && tRight < tMin) {
      tMin = tRight;
      vec3 base = vec3(0.015, 0.02, 0.045) + vec3(0.01, 0.02, 0.03) * p.y;
      vec3 sign = neonSign(vec2(p.z, p.y), 1.0);
      color = base + sign;
    }
  }

  if (tMin > 1e8) {
    color = vec3(0.01, 0.015, 0.03);
    tMin = 8.0;
  }

  float fog = 1.0 - exp(-tMin * 0.08);
  vec3 fogColor = vec3(0.02, 0.02, 0.05);
  color = mix(color, fogColor, fog);

  float rainDensity = clamp(u_rms * 1.4 + 0.15, 0.1, 1.0);
  float rain = rainLayer(uv, u_time + u_seed, rainDensity);
  rain += rainLayer(uv * 1.3 + vec2(0.2, 0.1), u_time * 1.2 + 4.2, rainDensity * 0.8);
  rain *= 0.35 + u_rms * 0.6;
  color = mix(color, vec3(0.6, 0.8, 1.0), rain);

  float beatGlow = u_beatStrength * 0.4 + u_bass * 0.2;
  color *= 1.0 + beatGlow;
  color = pow(color * u_exposure, vec3(0.9));

  fragColor = vec4(color, 1.0);
}
`;
