import { describe, expect, it } from "vitest";

import { rayPlaneIntersection, raySphereIntersection, resolveRaytraceQualitySettings } from "./raytraceSpheres";

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

describe("raytraceSpheres quality defaults", () => {
  it("scales buffers and defaults based on quality", () => {
    const settings = resolveRaytraceQualitySettings({}, 320, 180);
    expect(settings.quality).toBe(2);
    expect(settings.bufW).toBe(320);
    expect(settings.bufH).toBe(180);

    const crisp = resolveRaytraceQualitySettings({ quality: 3 }, 320, 180);
    expect(crisp.bufW).toBe(480);
    expect(crisp.bufH).toBe(270);
    expect(crisp.cellSize).toBe(2);
    expect(crisp.refineThreshold).toBe(50);
    expect(crisp.aa).toBe(2);
  });

  it("respects explicit buffers and downgrades AA when oversized", () => {
    const settings = resolveRaytraceQualitySettings({ bufW: 1000, bufH: 700, aa: 4 }, 320, 180);
    expect(settings.bufW).toBe(1000);
    expect(settings.bufH).toBe(700);
    expect(settings.aa).toBe(2);

    const forced = resolveRaytraceQualitySettings({ bufW: 1000, bufH: 700, aa: 4, forceAA: true }, 320, 180);
    expect(forced.aa).toBe(4);
  });
});
