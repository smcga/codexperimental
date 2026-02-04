import { describe, expect, it } from "vitest";

import { buildTunnelLuts, buildTunnelTexture, computeTunnelLight } from "./textureTunnel";

describe("texture tunnel helpers", () => {
  it("builds angle and inverse radius lookup tables", () => {
    const { angLUT, invRLUT } = buildTunnelLuts(4, 4, 512);
    const centerIndex = 2 + 2 * 4;

    expect(angLUT[centerIndex]).toBe(128);
    expect(invRLUT[centerIndex]).toBe(255);
  });

  it("creates deterministic procedural textures for a seed", () => {
    const texA = buildTunnelTexture(42);
    const texB = buildTunnelTexture(42);
    const texC = buildTunnelTexture(43);

    expect(texA.slice(0, 30)).toEqual(texB.slice(0, 30));
    expect(texA.slice(0, 30)).not.toEqual(texC.slice(0, 30));
  });

  it("scales tunnel lighting with proximity and beat", () => {
    const base = computeTunnelLight(0.2, 0, 1);
    const near = computeTunnelLight(0.9, 0, 1);
    const beat = computeTunnelLight(0.9, 1, 1);

    expect(near).toBeGreaterThan(base);
    expect(beat).toBeGreaterThan(near);
  });
});
