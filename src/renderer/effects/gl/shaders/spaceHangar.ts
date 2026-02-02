export const SPACE_HANGAR_FRAGMENT_SHADER = `#version 300 es
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
uniform float u_speed;
uniform vec2 u_camOffset;
uniform float u_aspect;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 applyHue(vec3 color, float shift) {
  float angle = shift * 6.28318;
  float s = sin(angle);
  float c = cos(angle);
  mat3 hue = mat3(
    0.299 + 0.701 * c + 0.168 * s, 0.587 - 0.587 * c + 0.330 * s, 0.114 - 0.114 * c - 0.497 * s,
    0.299 - 0.299 * c - 0.328 * s, 0.587 + 0.413 * c + 0.035 * s, 0.114 - 0.114 * c + 0.292 * s,
    0.299 - 0.300 * c + 1.250 * s, 0.587 - 0.588 * c - 1.050 * s, 0.114 + 0.886 * c - 0.203 * s
  );
  return clamp(hue * color, 0.0, 2.0);
}

void main() {
  float aspect = u_aspect > 0.0 ? u_aspect : (u_resolution.x / max(1.0, u_resolution.y));
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  uv.x *= aspect;

  float width = 3.2;
  float height = 2.0;
  float travel = u_time * u_speed;
  vec2 sway = vec2(0.15 * sin(u_time * 0.35 + u_seed), 0.08 * sin(u_time * 0.27 + 1.0 + u_seed));
  vec3 ro = vec3(0.0, 0.0, travel);
  ro.xy += sway + u_camOffset;

  vec3 rd = normalize(vec3(uv, 1.7));
  rd.xy += sway * 0.2;

  float tMin = 1e9;
  vec3 normal = vec3(0.0);
  int surfaceId = 0;

  if (abs(rd.y) > 0.0001) {
    float tFloor = (-height - ro.y) / rd.y;
    vec3 hitFloor = ro + rd * tFloor;
    if (tFloor > 0.0 && abs(hitFloor.x) <= width) {
      tMin = tFloor;
      normal = vec3(0.0, 1.0, 0.0);
      surfaceId = 1;
    }
    float tCeil = (height - ro.y) / rd.y;
    vec3 hitCeil = ro + rd * tCeil;
    if (tCeil > 0.0 && abs(hitCeil.x) <= width && tCeil < tMin) {
      tMin = tCeil;
      normal = vec3(0.0, -1.0, 0.0);
      surfaceId = 2;
    }
  }

  if (abs(rd.x) > 0.0001) {
    float tLeft = (-width - ro.x) / rd.x;
    vec3 hitLeft = ro + rd * tLeft;
    if (tLeft > 0.0 && abs(hitLeft.y) <= height && tLeft < tMin) {
      tMin = tLeft;
      normal = vec3(1.0, 0.0, 0.0);
      surfaceId = 3;
    }
    float tRight = (width - ro.x) / rd.x;
    vec3 hitRight = ro + rd * tRight;
    if (tRight > 0.0 && abs(hitRight.y) <= height && tRight < tMin) {
      tMin = tRight;
      normal = vec3(-1.0, 0.0, 0.0);
      surfaceId = 4;
    }
  }

  if (surfaceId == 0) {
    fragColor = vec4(0.0);
    return;
  }

  vec3 hitPos = ro + rd * tMin;
  float zPos = hitPos.z;
  float distanceFog = tMin;

  vec3 baseColor = vec3(0.07, 0.08, 0.11);
  if (surfaceId == 1) {
    baseColor = vec3(0.08, 0.09, 0.13);
  } else if (surfaceId == 2) {
    baseColor = vec3(0.05, 0.06, 0.09);
  }

  float ribSpacing = 4.5;
  float rib = smoothstep(0.18, 0.0, abs(fract(zPos / ribSpacing) - 0.5));

  float gridX = abs(fract((hitPos.x + width) * 0.35) - 0.5);
  float gridZ = abs(fract(zPos * 0.25) - 0.5);
  float panelLines = smoothstep(0.04, 0.0, min(gridX, gridZ));

  float hazard = 0.0;
  if (surfaceId == 1 && abs(hitPos.x) > width - 0.4) {
    float stripe = step(0.5, fract(zPos * 0.4));
    hazard = mix(0.1, 0.8, stripe);
  }

  float lightSpacing = 6.0;
  float lightBand = smoothstep(0.7, 0.0, abs(hitPos.x));
  float lightPulse = smoothstep(0.08, 0.0, abs(fract(zPos / lightSpacing) - 0.5));
  float flicker = 0.85 + 0.15 * sin(u_time * 8.0 + zPos * 0.2 + u_seed);
  float lightIntensity = lightBand * lightPulse * (0.6 + u_bass * 0.8 + u_beatStrength * 0.9) * flicker;

  float slotSpacing = 7.0;
  float slotIndex = floor(zPos / slotSpacing);
  float slotRand = hash11(slotIndex + u_seed * 1.3);
  float slotRand2 = hash11(slotIndex + u_seed * 2.7);
  float slotRand3 = hash11(slotIndex + u_seed * 3.9);
  float localZ = fract(zPos / slotSpacing) * slotSpacing;
  float objZ = mix(1.4, slotSpacing - 1.4, slotRand2);
  float objSpan = mix(0.6, 1.2, slotRand3);
  float objWidth = mix(0.3, 0.7, slotRand);
  float side = slotRand < 0.5 ? -1.0 : 1.0;
  float dressing = 0.0;

  if (slotRand > 0.55) {
    if (surfaceId == 1) {
      float floorMask = max(abs(hitPos.x - side * (width - 0.6)) - objWidth, abs(localZ - objZ) - objSpan);
      dressing = smoothstep(0.1, -0.05, floorMask);
    } else if (surfaceId == 3 || surfaceId == 4) {
      float shipHeight = mix(0.4, 1.1, slotRand2);
      float shipCenter = -height + shipHeight + 0.25;
      float wallMask = max(abs(hitPos.y - shipCenter) - shipHeight, abs(localZ - objZ) - objSpan);
      dressing = smoothstep(0.12, -0.05, wallMask);
    }
  }

  vec3 lightColor = vec3(0.7, 0.85, 1.0);
  vec3 ambient = vec3(0.03, 0.04, 0.06);
  vec3 lightDir = normalize(vec3(0.2, 0.9, 0.3));
  float diff = clamp(dot(normal, lightDir), 0.0, 1.0);
  vec3 color = baseColor * (0.6 + diff * 0.6) + ambient;

  if (surfaceId == 1) {
    float spec = pow(clamp(dot(reflect(-lightDir, normal), -rd), 0.0, 1.0), 24.0);
    color += spec * vec3(0.25, 0.3, 0.35);
  }

  color += panelLines * vec3(0.15, 0.22, 0.35);
  color = mix(color, vec3(0.08, 0.07, 0.05), rib * (surfaceId == 3 || surfaceId == 4 ? 0.8 : 0.4));
  color = mix(color, vec3(0.18, 0.15, 0.06), hazard);
  color = mix(color, vec3(0.02, 0.02, 0.03), dressing * 0.8);

  if (surfaceId == 2) {
    color += lightColor * lightIntensity * 2.2;
    color += lightColor * lightIntensity * 0.8 / (abs(hitPos.x) + 0.4);
  }

  float exitDist = 45.0;
  float portal = 0.0;
  if (rd.z > 0.0) {
    float tExit = exitDist / rd.z;
    vec3 exitPos = ro + rd * tExit;
    if (abs(exitPos.x) < width && abs(exitPos.y) < height) {
      float edge = max(abs(exitPos.x) / width, abs(exitPos.y) / height);
      portal = smoothstep(1.0, 0.7, edge);
    }
  }

  vec3 exitColor = vec3(0.6, 0.8, 1.1) * (portal * (0.6 + u_bass * 0.6));
  color += exitColor;

  float fogAmount = mix(0.04, 0.085, u_rms);
  float fog = exp(-distanceFog * fogAmount);
  vec3 fogColor = vec3(0.03, 0.04, 0.07) + exitColor * 0.5;
  color = mix(fogColor, color, clamp(fog, 0.0, 1.0));

  color = applyHue(color, u_hueShift);
  color *= u_exposure;
  color = pow(color, vec3(0.95));

  fragColor = vec4(color, 1.0);
}
`;
