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
uniform float u_warp;
uniform float u_speed;
uniform float u_hueShift;
uniform float u_exposure;
uniform float u_seed;
uniform int u_steps;
uniform float u_quality;
uniform float u_aspect;
uniform float u_cameraRadius;
uniform float u_cameraHeight;
uniform float u_cameraOrbitSpeed;
uniform float u_paletteSpeed;
uniform float u_audioReact;
uniform float u_beatKick;
uniform float u_fractalScale;

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec3 hueShift(vec3 color, float amount) {
  float angle = amount * 6.28318530718;
  float s = sin(angle);
  float c = cos(angle);
  mat3 m = mat3(
    vec3(0.299 + 0.701 * c + 0.168 * s, 0.587 - 0.587 * c + 0.330 * s, 0.114 - 0.114 * c - 0.497 * s),
    vec3(0.299 - 0.299 * c - 0.328 * s, 0.587 + 0.413 * c + 0.035 * s, 0.114 - 0.114 * c + 0.292 * s),
    vec3(0.299 - 0.300 * c + 1.250 * s, 0.587 - 0.588 * c - 1.050 * s, 0.114 + 0.886 * c - 0.203 * s)
  );
  return clamp(m * color, 0.0, 6.0);
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdPillar(vec3 p, float radius, float facetSharpness) {
  float facets = mix(4.0, 10.0, clamp(facetSharpness, 0.0, 1.0));
  float a = atan(p.x, p.z);
  float sector = 6.28318530718 / facets;
  float snapped = floor((a + 0.5 * sector) / sector) * sector;
  vec2 q = vec2(cos(snapped), sin(snapped)) * length(vec2(p.x, p.z));
  return length(q) - radius;
}

vec2 mapScene(vec3 p, float archSpacing, float density, float symmetry, float pulse, float facetSharpness) {
  vec3 q = p;
  q.x = mix(q.x, abs(q.x), clamp(symmetry, 0.0, 1.0));

  float segment = floor((q.z + archSpacing * 0.5) / archSpacing);
  float localZ = mod(q.z + archSpacing * 0.5, archSpacing) - archSpacing * 0.5;

  float arch = max(length(vec2(q.x, q.y - 2.5)) - (2.0 + density * 0.7 + pulse * 0.15), abs(localZ) - 0.18);
  float sidePillar = sdPillar(vec3(abs(q.x) - (2.6 + density * 0.9), q.y - 1.7, localZ), 0.22 + density * 0.11, facetSharpness);
  sidePillar = max(sidePillar, abs(q.y - 1.7) - 1.7);

  float rib = sdBox(vec3(abs(q.x) - (1.7 + density * 0.6), q.y - (2.1 + sin(segment * 0.6 + u_seed) * 0.2), localZ), vec3(0.11, 1.8, 0.05));

  float seam = sdBox(vec3(q.x, q.y - 1.8, localZ), vec3(0.06 + pulse * 0.03, 1.4, 0.06));
  float floor = q.y;

  float d = floor;
  float mat = 1.0;

  if (arch < d) {
    d = arch;
    mat = 2.0;
  }
  if (sidePillar < d) {
    d = sidePillar;
    mat = 3.0;
  }
  if (rib < d) {
    d = rib;
    mat = 4.0;
  }
  if (seam < d) {
    d = seam;
    mat = 5.0;
  }

  return vec2(d, mat);
}

vec3 estimateNormal(vec3 p, float archSpacing, float density, float symmetry, float pulse, float facetSharpness) {
  vec2 e = vec2(0.001, 0.0);
  float x = mapScene(p + vec3(e.x, e.y, e.y), archSpacing, density, symmetry, pulse, facetSharpness).x - mapScene(p - vec3(e.x, e.y, e.y), archSpacing, density, symmetry, pulse, facetSharpness).x;
  float y = mapScene(p + vec3(e.y, e.x, e.y), archSpacing, density, symmetry, pulse, facetSharpness).x - mapScene(p - vec3(e.y, e.x, e.y), archSpacing, density, symmetry, pulse, facetSharpness).x;
  float z = mapScene(p + vec3(e.y, e.y, e.x), archSpacing, density, symmetry, pulse, facetSharpness).x - mapScene(p - vec3(e.y, e.y, e.x), archSpacing, density, symmetry, pulse, facetSharpness).x;
  return normalize(vec3(x, y, z));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
  uv.x *= u_aspect;

  float audioReact = clamp(u_audioReact, 0.0, 1.0);
  float beatLift = u_beatStrength * clamp(u_beatKick, 0.0, 1.0);
  float bassPulse = (u_bass * 0.7 + u_rms * 0.3) * audioReact;
  float pulse = bassPulse + beatLift * 0.45;

  float speed = max(0.1, u_speed);
  float drift = u_time * speed;
  float sway = sin(drift * 0.35 + u_seed * 0.07) * 0.18;
  float bank = sin(drift * 0.22 + u_seed * 0.11) * 0.06;

  vec3 ro = vec3(sway, 1.22 + sin(drift * 0.18) * 0.06, drift * 3.0 + beatLift * 0.6);
  vec3 rd = normalize(vec3(uv, 1.7));
  rd.xy *= rot(bank);
  rd.yz *= rot(-0.05 + sin(drift * 0.15) * 0.03);

  float archSpacing = mix(2.8, 4.8, clamp(u_warp / 1.4, 0.0, 1.0));
  archSpacing *= 1.0 + bassPulse * 0.14;
  float density = clamp(u_warp, 0.2, 1.6);
  float symmetry = clamp(u_cameraRadius, 0.0, 1.0);
  float reflectivity = clamp(u_cameraHeight, 0.0, 1.0);
  float fogAmount = clamp(u_cameraOrbitSpeed, 0.0, 1.0);
  float glow = clamp(u_paletteSpeed, 0.0, 2.0);
  float facetSharpness = clamp(u_fractalScale / 1.5, 0.0, 1.0);

  vec3 color = vec3(0.0);
  vec3 throughput = vec3(1.0);
  float t = 0.0;
  float fogAcc = 0.0;
  bool hit = false;

  for (int i = 0; i < 220; i++) {
    if (i >= u_steps) {
      break;
    }
    vec3 pos = ro + rd * t;
    vec2 scene = mapScene(pos, archSpacing, density, symmetry, pulse, facetSharpness);
    float dist = scene.x;
    float mat = scene.y;

    float seamGlow = exp(-abs(pos.x) * 16.0) * exp(-abs(pos.y - 1.8) * 1.8);
    float trebleSparkle = 0.55 + 0.45 * sin(pos.z * 6.0 + u_time * 14.0 + u_treble * 12.0 + u_seed);
    vec3 medium = vec3(0.04, 0.08, 0.12) * (0.4 + glow * 0.8) * seamGlow * (0.4 + trebleSparkle * 0.6);
    color += throughput * medium * (0.015 + u_mid * 0.03 + beatLift * 0.04);

    fogAcc += exp(-max(0.0, pos.y - 0.3) * 0.5) * (0.006 + fogAmount * 0.012);

    if (dist < 0.0015) {
      vec3 n = estimateNormal(pos, archSpacing, density, symmetry, pulse, facetSharpness);
      vec3 l = normalize(vec3(0.0, 1.8, 0.2) - pos + vec3(0.0, 0.0, 2.0));
      vec3 v = normalize(ro - pos);
      vec3 h = normalize(l + v);

      float diff = max(dot(n, l), 0.0);
      float spec = pow(max(dot(n, h), 0.0), mix(22.0, 80.0, facetSharpness));
      float fres = pow(1.0 - max(dot(n, v), 0.0), 2.6);

      vec3 base = vec3(0.17, 0.26, 0.34);
      if (mat > 4.5) {
        base = vec3(0.35, 0.85, 1.2) * (1.0 + beatLift * 0.5 + bassPulse * 0.4);
      } else if (mat > 3.5) {
        base = vec3(0.2, 0.42, 0.62) * (1.0 + u_treble * 0.25);
      } else if (mat > 2.5) {
        base = vec3(0.15, 0.33, 0.5);
      } else if (mat > 1.5) {
        base = vec3(0.11, 0.27, 0.4);
      }

      vec3 lit = base * (0.2 + diff * 0.85) + vec3(0.8, 1.0, 1.2) * spec * (0.35 + glow * 0.4);
      lit += vec3(0.3, 0.6, 1.0) * fres * (0.3 + glow * 0.3 + u_treble * 0.4);

      if (mat < 1.5) {
        vec3 rr = reflect(rd, n);
        float seam = exp(-abs(pos.x) * 14.0) * (0.5 + 0.5 * sin(pos.z * 2.4 + u_time * 3.4));
        vec3 reflectCol = vec3(0.09, 0.22, 0.35) * seam * (0.8 + glow * 0.6 + beatLift * 0.5);
        lit = mix(lit, reflectCol + lit * 0.4, reflectivity * (0.4 + 0.6 * fres));
        lit += vec3(0.12, 0.24, 0.4) * pow(max(rr.y, 0.0), 3.0) * reflectivity;
      }

      color += throughput * lit;
      hit = true;
      break;
    }

    float stepLen = clamp(dist, 0.02, 0.45 + density * 0.06);
    t += stepLen;

    if (t > 72.0) {
      break;
    }

    throughput *= 0.996;
  }

  float sky = exp(-length(uv) * 2.2);
  vec3 bg = vec3(0.02, 0.035, 0.055) + vec3(0.09, 0.14, 0.2) * sky;
  if (!hit) {
    color += bg;
  }

  vec3 fogColor = vec3(0.05, 0.09, 0.13) + vec3(0.08, 0.14, 0.2) * glow;
  float depthFog = 1.0 - exp(-t * (0.03 + fogAmount * 0.07));
  float volumeFog = 1.0 - exp(-fogAcc);
  color = mix(color, fogColor, clamp(depthFog + volumeFog * 0.7, 0.0, 0.96));

  color = hueShift(color, u_hueShift);
  color *= u_exposure;
  color = color / (color + vec3(1.0));
  color = pow(color, vec3(0.92));

  fragColor = vec4(color, 1.0);
}
`;
