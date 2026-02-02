export const SPACE_HANGAR_FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_rms;
uniform float u_bass;
uniform float u_seed;
uniform float u_speed;
uniform vec2 u_camOffset;
uniform float u_exposure;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float sdBox2(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return max(d.x, d.y);
}

float lineMask(float coord, float width) {
  float edge = abs(fract(coord) - 0.5);
  return 1.0 - smoothstep(0.5 - width, 0.5, edge);
}

vec3 applyExitGlow(vec3 color, vec3 ro, vec3 rd, float w, float h) {
  float exitZ = ro.z + 60.0;
  if (rd.z <= 0.01) {
    return color;
  }
  float t = (exitZ - ro.z) / rd.z;
  if (t <= 0.0) {
    return color;
  }
  vec3 pos = ro + rd * t;
  float inside = step(abs(pos.x), w * 0.9) * step(abs(pos.y), h * 0.85);
  float falloff = exp(-t * 0.05);
  vec3 glow = vec3(0.7, 0.9, 1.1) * (1.4 + u_bass * 0.9);
  return color + glow * inside * falloff;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / max(u_resolution.y, 1.0);
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  uv.x *= aspect;

  float speed = max(0.1, u_speed);
  float travel = u_time * speed * 4.0;
  vec3 ro = vec3(u_camOffset, travel);
  vec3 rd = normalize(vec3(uv, 1.5));

  float w = 2.8;
  float h = 1.6;

  float tMin = 1e9;
  vec3 normal = vec3(0.0);
  float surfaceId = -1.0;

  if (abs(rd.y) > 0.0001) {
    float tFloor = (-h - ro.y) / rd.y;
    if (tFloor > 0.0) {
      vec3 p = ro + rd * tFloor;
      if (abs(p.x) <= w) {
        tMin = tFloor;
        normal = vec3(0.0, 1.0, 0.0);
        surfaceId = 0.0;
      }
    }
    float tCeil = (h - ro.y) / rd.y;
    if (tCeil > 0.0 && tCeil < tMin) {
      vec3 p = ro + rd * tCeil;
      if (abs(p.x) <= w) {
        tMin = tCeil;
        normal = vec3(0.0, -1.0, 0.0);
        surfaceId = 1.0;
      }
    }
  }

  if (abs(rd.x) > 0.0001) {
    float tLeft = (-w - ro.x) / rd.x;
    if (tLeft > 0.0 && tLeft < tMin) {
      vec3 p = ro + rd * tLeft;
      if (abs(p.y) <= h) {
        tMin = tLeft;
        normal = vec3(1.0, 0.0, 0.0);
        surfaceId = 2.0;
      }
    }
    float tRight = (w - ro.x) / rd.x;
    if (tRight > 0.0 && tRight < tMin) {
      vec3 p = ro + rd * tRight;
      if (abs(p.y) <= h) {
        tMin = tRight;
        normal = vec3(-1.0, 0.0, 0.0);
        surfaceId = 3.0;
      }
    }
  }

  vec3 fogColor = vec3(0.04, 0.05, 0.08);
  if (surfaceId < 0.0) {
    vec3 glow = applyExitGlow(fogColor, ro, rd, w, h);
    fragColor = vec4(glow, 1.0);
    return;
  }

  vec3 hitPos = ro + rd * tMin;
  float z = hitPos.z;
  float ribPhase = abs(fract((z + u_seed * 2.7) / 4.0) - 0.5);
  float rib = smoothstep(0.26, 0.0, ribPhase);

  vec3 baseColor = vec3(0.08, 0.09, 0.11);
  if (surfaceId == 1.0) {
    baseColor = vec3(0.06, 0.07, 0.09);
  } else if (surfaceId >= 2.0) {
    baseColor = vec3(0.07, 0.08, 0.1);
  }

  vec3 color = baseColor;

  if (surfaceId == 0.0) {
    float gridX = lineMask(hitPos.x * 0.8, 0.03);
    float gridZ = lineMask(hitPos.z * 0.35, 0.02);
    float seams = max(gridX, gridZ);
    color += vec3(0.4, 0.6, 0.8) * seams * 0.35;

    float edgeMask = smoothstep(w - 0.4, w - 0.05, abs(hitPos.x));
    float stripe = step(0.5, fract((hitPos.z + u_seed) * 0.25));
    vec3 stripeColor = mix(vec3(0.15, 0.15, 0.15), vec3(0.85, 0.6, 0.12), stripe);
    color = mix(color, stripeColor, edgeMask * 0.35);
  }

  if (surfaceId >= 2.0 || surfaceId == 1.0) {
    color = mix(color, color * 0.55, rib);
    float alcove = lineMask(hitPos.z * 0.45, 0.08) * smoothstep(0.9, 0.2, abs(hitPos.y));
    color = mix(color, color * 0.7, alcove * 0.5);
  }

  float lightPhase = abs(fract((hitPos.z + u_seed * 1.1) / 3.2) - 0.5);
  float lightPulse = smoothstep(0.2, 0.0, lightPhase);
  float flicker = 0.85 + 0.15 * sin(u_time * 18.0 + u_seed) + u_bass * 0.6;
  float lightBand = smoothstep(0.5, 0.0, abs(hitPos.x));
  float ceilingGlow = lightPulse * lightBand * flicker;

  if (surfaceId == 1.0) {
    vec3 lightColor = vec3(1.2, 1.25, 1.35);
    color += lightColor * ceilingGlow * 2.2;
  } else {
    float spill = ceilingGlow * exp(-abs(hitPos.y - h) * 2.4);
    color += vec3(0.5, 0.7, 0.9) * spill * 0.8;
  }

  float cell = floor((hitPos.z + u_seed * 5.0) / 10.0);
  float slot = hash11(cell + surfaceId * 13.1);
  if (slot > 0.2 && slot < 0.7) {
    float objZ = (cell + 0.5) * 10.0 + (slot - 0.5) * 2.0 - u_seed * 2.0;
    if (surfaceId == 0.0) {
      float side = hash11(cell + 8.3) > 0.5 ? 1.0 : -1.0;
      float objX = side * (w - 0.7);
      vec2 local = vec2(hitPos.z - objZ, hitPos.x - objX);
      float crate = sdBox2(local, vec2(0.5, 0.35));
      if (crate < 0.0) {
        color *= 0.5;
      }
    } else if (surfaceId >= 2.0) {
      float objY = -h + 0.45 + hash11(cell + 4.7) * 0.3;
      vec2 local = vec2(hitPos.z - objZ, hitPos.y - objY);
      float crate = sdBox2(local, vec2(0.55, 0.28));
      float ship = max(abs(local.y) - 0.25, local.x + local.y * 0.4 - 0.3);
      float shape = mix(crate, ship, step(0.45, slot));
      if (shape < 0.0) {
        color *= 0.45;
      }
    }
  }

  vec3 lightDir = normalize(vec3(0.2, 0.9, 0.1));
  float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
  float spec = 0.0;
  if (surfaceId == 0.0) {
    vec3 reflectDir = reflect(-lightDir, normal);
    spec = pow(max(dot(reflectDir, -rd), 0.0), 32.0);
  }
  color *= 0.5 + diff * 0.5;
  color += vec3(1.0, 1.0, 1.0) * spec * 0.45;

  color = applyExitGlow(color, ro, rd, w, h);
  float fogAmount = 0.05 + u_rms * 0.05;
  float fog = exp(-tMin * fogAmount);
  color = mix(fogColor, color, clamp(fog, 0.0, 1.0));

  color = pow(color * u_exposure, vec3(0.9));
  fragColor = vec4(color, 1.0);
}
`;
