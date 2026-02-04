import { describe, expect, it } from "vitest";

import { buildBaseHeightMap } from "./bumpmapPlane";

describe("bumpmapPlane height map", () => {
  it("builds deterministic height maps for the same seed", () => {
    const first = buildBaseHeightMap({ width: 8, height: 6, seed: 1, embossStrength: 0 });
    const second = buildBaseHeightMap({ width: 8, height: 6, seed: 1, embossStrength: 0 });

    expect(Array.from(first)).toEqual(Array.from(second));
  });

  it("varies the height map when the seed changes", () => {
    const first = buildBaseHeightMap({ width: 8, height: 6, seed: 1, embossStrength: 0 });
    const second = buildBaseHeightMap({ width: 8, height: 6, seed: 2, embossStrength: 0 });

    expect(Array.from(first)).not.toEqual(Array.from(second));
  });

  it("keeps height values within the byte range", () => {
    const map = buildBaseHeightMap({ width: 16, height: 12, seed: 3, embossStrength: 0 });
    const min = Math.min(...map);
    const max = Math.max(...map);

    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(255);
  });
});
