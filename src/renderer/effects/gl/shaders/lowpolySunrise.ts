export const LOWPOLY_SUNRISE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rms;
uniform float u_bass;
uniform float u_seed;
uniform float u_aspect;
uniform int u_steps;
uniform vec2 u_sunPos;
uniform vec3 u_sunDir;
uniform float u_fogAmount;
uniform vec3 u_cloudOffset;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(27.1, 91.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i + u_seed);
  float b = hash21(i + vec2(1.0, 0.0) + u_seed);
  float c = hash21(i + vec2(0.0, 1.0) + u_seed);
  float d = hash21(i + vec2(1.0, 1.0) + u_seed);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += noise(p * frequency) * amplitude;
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float ridgeNoise(vec2 p) {
  float n = fbm(p);
  return 1.0 - abs(n * 2.0 - 1.0);
}

float terrainHeight(vec2 p) {
  float ridge = ridgeNoise(p * 0.5);
  float detail = fbm(p * 1.6);
  float sweep = smoothstep(-2.0, 4.0, p.y);
  return ridge * 2.2 + detail * 0.6 + sweep * 0.25;
}

vec3 getSkyColor(vec2 uv, vec2 sunUv) {
  vec3 top = vec3(0.06, 0.12, 0.38);
  vec3 mid = vec3(0.25, 0.18, 0.42);
  vec3 horizon = vec3(1.05, 0.55, 0.3);
  float t = clamp(uv.y, 0.0, 1.0);
  vec3 gradient = mix(horizon, mid, smoothstep(0.0, 0.6, t));
  gradient = mix(gradient, top, smoothstep(0.4, 1.0, t));

  vec2 sunVec = (uv - sunUv) * vec2(u_aspect, 1.0);
  float dist = length(sunVec);
  float sunRadius = 0.085;
  float sunDisk = smoothstep(sunRadius, sunRadius - 0.015, dist);
  float glow = exp(-dist * 6.5) * (1.4 + u_bass * 1.1);

  float angle = atan(sunVec.y, sunVec.x);
  float rays = pow(max(0.0, 1.0 - dist * 1.9), 3.0);
  rays *= 0.4 + 0.35 * sin(angle * 8.0 + u_time * 0.3 + u_seed);

  vec3 sunColor = vec3(1.1, 0.74, 0.45);
  gradient += sunColor * (sunDisk + glow * 0.75 + rays * 0.7);
  return gradient;
}

float cloudLayer(vec2 uv, float scale, float density, float offset) {
  vec2 p = uv * scale + vec2(offset, offset * 0.4);
  float n = fbm(p);
  float band = smoothstep(density, 1.0, n);
  float fade = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.6, uv.y);
  return band * fade;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 centered = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  centered.x *= u_aspect;

  vec3 ro = vec3(0.0, 1.2 + 0.05 * sin(u_time * 0.2), -2.5 + u_time * 0.05);
  vec3 target = ro + vec3(0.0, -0.15, 1.2);
  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = cross(forward, right);
  vec3 rd = normalize(forward + centered.x * right + centered.y * up);

  vec2 sunUv = vec2(u_sunPos.x, u_sunPos.y);
  vec3 skyColor = getSkyColor(uv, sunUv);

  float cloudSpeed = 0.025 + u_rms * 0.01;
  float cloud1 = cloudLayer(uv + vec2(u_cloudOffset.x * cloudSpeed, 0.0), 2.0, 0.5, u_cloudOffset.x);
  float cloud2 = cloudLayer(uv + vec2(u_cloudOffset.y * cloudSpeed, 0.0), 3.2, 0.56, u_cloudOffset.y);
  float cloud3 = cloudLayer(uv + vec2(u_cloudOffset.z * cloudSpeed, 0.0), 4.6, 0.6, u_cloudOffset.z);
  float clouds = clamp(cloud1 * 0.6 + cloud2 * 0.45 + cloud3 * 0.3, 0.0, 1.0);

  float sunGlow = smoothstep(0.6, 0.0, distance(uv, sunUv));
  vec3 cloudColor = mix(vec3(0.7, 0.62, 0.58), vec3(1.08, 0.96, 0.9), sunGlow);
  skyColor = mix(skyColor, cloudColor, clouds * 0.85);

  float t = 0.0;
  float maxT = 40.0;
  bool hit = false;
  vec3 p = vec3(0.0);
  for (int i = 0; i < 96; i++) {
    if (i >= u_steps) {
      break;
    }
    p = ro + rd * t;
    float h = terrainHeight(p.xz);
    if (p.y < h) {
      hit = true;
      break;
    }
    float stepSize = max(0.05, (p.y - h) * 0.5);
    t += stepSize;
    if (t > maxT) {
      break;
    }
  }

  vec3 color = skyColor;
  if (hit) {
    float eps = 0.05;
    float h1 = terrainHeight(p.xz + vec2(eps, 0.0));
    float h2 = terrainHeight(p.xz - vec2(eps, 0.0));
    float h3 = terrainHeight(p.xz + vec2(0.0, eps));
    float h4 = terrainHeight(p.xz - vec2(0.0, eps));
    vec3 normal = normalize(vec3(h2 - h1, 2.0 * eps, h4 - h3));

    vec2 cell = floor(p.xz * 0.6);
    float facet = hash21(cell + u_seed) - 0.5;
    normal = normalize(normal + vec3(facet, facet * 0.3, -facet) * 0.15);

    vec3 lightDir = normalize(u_sunDir);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float steps = 5.0;
    diffuse = floor(diffuse * steps) / steps;

    float rim = pow(1.0 - max(dot(normal, -rd), 0.0), 2.0);
    rim *= 0.35 + u_bass * 0.6;

    float depthTint = smoothstep(2.0, 16.0, t);
    vec3 baseColor = mix(vec3(0.02, 0.04, 0.08), vec3(0.28, 0.18, 0.12), depthTint);
    vec3 warmHighlight = vec3(1.05, 0.62, 0.35);
    vec3 terrainColor = baseColor * (0.35 + diffuse * 1.1);
    terrainColor += rim * warmHighlight;

    float fog = 1.0 - exp(-t * u_fogAmount);
    color = mix(terrainColor, skyColor, clamp(fog * 0.9, 0.0, 1.0));
  }

  fragColor = vec4(color, 1.0);
}
`;
