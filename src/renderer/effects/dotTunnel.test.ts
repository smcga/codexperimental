import { describe, expect, it } from "vitest";
import { initializeDotTunnelParticles, projectDotTunnelPoint } from "./dotTunnel";

describe("initializeDotTunnelParticles", () => {
  it("is deterministic for fixed ring/dot counts and seed", () => {
    const first = initializeDotTunnelParticles(6, 12, 42);
    const second = initializeDotTunnelParticles(6, 12, 42);
    const changedSeed = initializeDotTunnelParticles(6, 12, 43);

    expect(first).toEqual(second);
    expect(first).not.toEqual(changedSeed);
    expect(first).toHaveLength(72);
  });
});

describe("projectDotTunnelPoint", () => {
  it("keeps projection math stable for fixed camera and time-derived coordinates", () => {
    const projected = projectDotTunnelPoint(0.75, -0.2, 7.5, 72, 1280, 720);

    expect(projected).not.toBeNull();
    expect(projected?.x).toBeCloseTo(689.55, 2);
    expect(projected?.y).toBeCloseTo(346.79, 2);
    expect(projected?.scale).toBeCloseTo(66.07, 2);
    expect(projected?.depth).toBeCloseTo(7.5, 6);
  });

  it("culls points behind the near plane", () => {
    expect(projectDotTunnelPoint(0, 0, 0.01, 72, 640, 360)).toBeNull();
  });
});
