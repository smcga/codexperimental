import { describe, expect, it } from "vitest";
import { buildOrbitingSphereConfigs, buildSpherePoints, calculateOrbitCenter } from "./sphereEffect";

describe("buildSpherePoints", () => {
  it("creates a consistent vertex count", () => {
    const points = buildSpherePoints(6, 8);
    expect(points).toHaveLength((6 + 1) * 8);
  });

  it("generates points on the unit sphere", () => {
    const points = buildSpherePoints(8, 12);
    points.forEach((point) => {
      const magnitude = Math.hypot(point.x, point.y, point.z);
      expect(Math.abs(magnitude - 1)).toBeLessThan(1e-6);
    });
  });
});

describe("orbiting sphere helpers", () => {
  it("returns stable orbit configurations", () => {
    const configs = buildOrbitingSphereConfigs();
    expect(configs).toHaveLength(3);
  });

  it("keeps orbit centers on the expected radius", () => {
    const configs = buildOrbitingSphereConfigs();
    configs.forEach((config) => {
      const center = calculateOrbitCenter(1.25, config, 1);
      const distance = Math.hypot(center.x, center.y, center.z);
      expect(Math.abs(distance - config.orbitRadius)).toBeLessThan(1e-6);
    });
  });
});
