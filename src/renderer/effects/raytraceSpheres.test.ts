import { describe, expect, it } from "vitest";

import {
  normalizeRaytraceSpheresParams,
  RAYTRACE_SPHERES_DEFAULTS,
  rayPlaneIntersection,
  raySphereIntersection
} from "./raytraceSpheres";

describe("raytraceSpheres intersections", () => {
  it("hits a sphere along the ray direction", () => {
    const t = raySphereIntersection(0, 0, -5, 0, 0, 1, 0, 0, 0, 1);
    expect(t).not.toBeNull();
    expect(t ?? 0).toBeCloseTo(4, 5);
  });

  it("returns null when missing a sphere", () => {
    const t = raySphereIntersection(0, 0, -5, 0, 1, 0, 0, 0, 0, 1);
    expect(t).toBeNull();
  });

  it("hits the floor plane", () => {
    const t = rayPlaneIntersection(0, 0, 0, 0, -1, 0, -1.1);
    expect(t).not.toBeNull();
    expect(t ?? 0).toBeCloseTo(1.1, 5);
  });

  it("returns null for parallel rays to the plane", () => {
    const t = rayPlaneIntersection(0, 0, 0, 1, 0, 0, -1.1);
    expect(t).toBeNull();
  });
});

describe("raytraceSpheres params", () => {
  it("uses higher-resolution defaults for the buffer", () => {
    const params = normalizeRaytraceSpheresParams({});
    expect(params.bufW).toBe(RAYTRACE_SPHERES_DEFAULTS.bufW);
    expect(params.bufH).toBe(RAYTRACE_SPHERES_DEFAULTS.bufH);
    expect(params.cellSize).toBe(RAYTRACE_SPHERES_DEFAULTS.cellSize);
  });

  it("clamps buffer sizes to the supported range", () => {
    const params = normalizeRaytraceSpheresParams({ bufW: 999, bufH: 999 });
    expect(params.bufW).toBe(360);
    expect(params.bufH).toBe(270);
  });
});
