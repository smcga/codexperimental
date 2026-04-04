export const CRYSTAL_CATHEDRAL_FRAGMENT_SHADER = `#version 300 es
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
uniform float u_hueShift;
uniform float u_exposure;
uniform float u_seed;
uniform float u_quality;
uniform float u_aspect;
uniform float u_speed;
uniform float u_audioReact;
uniform float u_beatKick;
uniform float u_crystalDensity;
uniform float u_symmetry;
uniform float u_reflectivity;
uniform float u_fog;
uniform float u_glow;
uniform float u_facetSharpness;

const float MAX_DIST = 60.0;

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float sdBox(vec3 p, vec3 b) {
  vec3 d = abs(p) - b;
  return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}

float sdPlane(vec3 p, vec3 n, float h) {
  return dot(p, n) + h;
}

vec3 opRepZ(vec3 p, float c) {
  p.z = mod(p.z + 0.5 * c, c) - 0.5 * c;
  return p;
}

float archShape(vec3 p, float breathing, float density) {
  float radius = 1.6 + 0.4 * breathing;
  float thickness = 0.16 / max(0.5, density);
  vec3 q = p;
  q.y -= 0.6;
  float ring = abs(length(q.xy) - radius) - thickness;
  float clip = max(abs(q.x) - (2.8 + density * 0.9), abs(q.y) - 2.5);
  return max(ring, -clip);
}

float crystalFacet(vec3 p, float sharpness) {
  vec3 q = abs(p);
  float m = max(max(q.x * 0.95 + q.y * 0.3, q.y * 0.85 + q.z * 0.45), q.x * 0.45 + q.z);
  return m - (0.55 + sharpness * 0.45);
}

float mapScene(vec3 p, out float material) {
  float breathing = 1.0 + u_audioReact * (u_bass * 0.55 + u_beatStrength * u_beatKick * 0.35);
  float density = max(0.2, u_crystalDensity);
  float archSpacing = mix(4.6, 2.8, clamp(density * 0.65, 0.0, 1.0)) * (1.0 + u_audioReact * u_bass * 0.15);

  vec3 q = p;
  q.x = mix(q.x, abs(q.x), clamp(u_symmetry, 0.0, 1.0));

  vec3 repeated = opRepZ(q, archSpacing);
  float arch = archShape(repeated, breathing, density);

  vec3 pillarLocal = repeated;
  pillarLocal.x = abs(pillarLocal.x) - (2.25 + density * 0.6);
  pillarLocal.y -= 0.4;
  float pillarBody = sdBox(pillarLocal, vec3(0.24, 2.1, 0.38));
  float pillarFacet = crystalFacet(pillarLocal * vec3(1.3, 1.0, 1.3), u_facetSharpness);
  float pillar = max(pillarBody, pillarFacet);

  vec3 ribLocal = repeated;
  ribLocal.x = abs(ribLocal.x) - (1.35 + density * 0.25);
  ribLocal.y -= 1.0;
  float ribs = max(sdBox(ribLocal, vec3(0.08, 1.5, 0.55)), crystalFacet(ribLocal * 1.8, u_facetSharpness * 0.6));

  float seam = sdBox(vec3(q.x, q.y - 0.2, repeated.z), vec3(0.065 + u_bass * 0.06, 1.8 + breathing * 0.35, 0.45));
  float floor = sdPlane(q, vec3(0.0, 1.0, 0.0), 1.7);

  float scene = floor;
  material = 1.0;
  if (arch < scene) {
    scene = arch;
    material = 2.0;
  }
  if (pillar < scene) {
    scene = pillar;
    material = 3.0;
  }
  if (ribs < scene) {
    scene = ribs;
    material = 4.0;
  }
  if (seam < scene) {
    scene = seam;
    material = 5.0;
  }

  float chatter = sin(q.z * 5.8 + q.y * 6.5 + u_time * 8.0) * (0.006 + 0.02 * u_treble * u_audioReact);
  return scene + chatter;
}

float mapSceneOnly(vec3 p) {
  float m = 0.0;
  return mapScene(p, m);
}

vec3 estimateNormal(vec3 p, float eps) {
  vec2 e = vec2(eps, 0.0);
  float dx = mapSceneOnly(p + vec3(e.x, e.y, e.y)) - mapSceneOnly(p - vec3(e.x, e.y, e.y));
  float dy = mapSceneOnly(p + vec3(e.y, e.x, e.y)) - mapSceneOnly(p - vec3(e.y, e.x, e.y));
  float dz = mapSceneOnly(p + vec3(e.y, e.y, e.x)) - mapSceneOnly(p - vec3(e.y, e.y, e.x));
  return normalize(vec3(dx, dy, dz));
}

vec3 palette(float t) {
  vec3 a = vec3(0.12, 0.18, 0.25);
  vec3 b = vec3(0.75, 0.65, 0.9);
  vec3 c = vec3(1.0, 0.95, 0.85);
  vec3 d = vec3(0.06, 0.23, 0.37);
  return a + b * cos(6.28318 * (c * t + d + u_hueShift));
}

vec3 shade(vec3 ro, vec3 rd, vec3 p, vec3 normal, float material, float dist) {
  vec3 corePos = vec3(0.0, 0.3 + u_bass * 0.3, ro.z + 6.0);
  vec3 toCore = normalize(corePos - p);
  float diffCore = clamp(dot(normal, toCore), 0.0, 1.0);
  float rim = pow(clamp(1.0 - max(0.0, dot(normal, -rd)), 0.0, 1.0), 2.2);
  float spec = pow(clamp(dot(reflect(-toCore, normal), -rd), 0.0, 1.0), mix(26.0, 70.0, clamp(u_facetSharpness, 0.1, 1.5) / 1.5));

  vec3 base = palette(dist * 0.04 + material * 0.07);
  vec3 seamColor = vec3(0.85, 0.95, 1.4) * (0.5 + u_glow * 0.8 + u_bass * 0.6 * u_audioReact);
  float seamMask = smoothstep(5.4, 4.4, abs(material - 5.0));

  float floorMask = smoothstep(1.6, 0.4, abs(material - 1.0));
  if (floorMask > 0.01) {
    vec3 reflectionDir = reflect(rd, normal);
    float fakeRef = pow(clamp(1.0 - abs(reflectionDir.y), 0.0, 1.0), 2.0) * (0.25 + u_reflectivity * 0.75);
    base += palette(p.z * 0.035 + p.x * 0.1) * fakeRef;
  }

  vec3 lit = base * (0.2 + diffCore * 0.9) + rim * vec3(0.35, 0.45, 0.6) + spec * vec3(0.95, 1.0, 1.1);
  lit += seamColor * seamMask;
  return lit;
}

void main() {
  float aspect = u_aspect > 0.0 ? u_aspect : (u_resolution.x / max(1.0, u_resolution.y));
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv.x *= aspect;

  int steps = u_quality < 1.5 ? 54 : (u_quality < 2.5 ? 82 : 110);
  float eps = u_quality < 1.5 ? 0.0032 : (u_quality < 2.5 ? 0.0024 : 0.0018);

  float t = u_time * u_speed;
  float beatPush = u_audioReact * u_beatKick * u_beatStrength * 0.5;
  float sway = sin(t * 0.35 + u_seed * 0.01) * 0.18;
  float bank = sin(t * 0.22 + u_seed * 0.013) * 0.08;
  vec3 ro = vec3(sway, -0.35 + sin(t * 0.27) * 0.05, t * 3.2 + beatPush);
  vec3 target = vec3(sway * 0.75 + sin(t * 0.4) * 0.12, -0.15 + sin(t * 0.31) * 0.06, ro.z + 3.6);

  vec3 forward = normalize(target - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
  vec3 up = normalize(cross(forward, right));
  right = vec3(rot(bank) * right.xz, right.y).xzy;

  vec3 rd = normalize(forward * 1.8 + right * uv.x + up * uv.y);

  float dist = 0.0;
  float fogAccum = 0.0;
  vec3 color = vec3(0.0);
  float material = 0.0;

  for (int i = 0; i < 120; i += 1) {
    if (i >= steps) {
      break;
    }
    vec3 p = ro + rd * dist;
    float d = mapScene(p, material);
    float glowField = exp(-abs(p.x) * 1.8) * exp(-abs(p.y + 0.4) * 1.2);
    vec3 fogGlow = vec3(0.08, 0.12, 0.2) + palette(p.z * 0.02 + 0.3) * 0.5;
    color += fogGlow * glowField * (0.014 + u_glow * 0.03 + u_rms * 0.02 * u_audioReact);
    fogAccum += glowField * 0.01;

    if (d < eps || dist > MAX_DIST) {
      break;
    }
    dist += d * 0.82;
  }

  vec3 hit = ro + rd * dist;
  float sceneDist = mapScene(hit, material);
  if (sceneDist < 0.018 && dist < MAX_DIST) {
    vec3 n = estimateNormal(hit, eps * 1.5);
    color += shade(ro, rd, hit, n, material, dist);
  }

  float depthFog = exp(-dist * mix(0.03, 0.09, clamp(u_fog, 0.0, 1.0)));
  vec3 fogColor = vec3(0.03, 0.05, 0.09) + palette(0.15 + u_hueShift * 0.4) * 0.12;
  color = mix(fogColor, color, clamp(depthFog + fogAccum * 0.7, 0.0, 1.0));

  float beatFlash = u_audioReact * (u_beat * 0.2 + u_beatStrength * 0.35) + u_rms * 0.08;
  color *= 1.0 + beatFlash;
  color = pow(max(color * u_exposure, 0.0), vec3(0.9));

  fragColor = vec4(color, 1.0);
}
`;
