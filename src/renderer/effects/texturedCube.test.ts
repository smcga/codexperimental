import { describe, expect, it } from "vitest";

import { projectVertex, rotateVertex } from "./texturedCube";

describe("texturedCube helpers", () => {
  it("rotates points around the Y axis", () => {
    const rotated = rotateVertex({ x: 1, y: 0, z: 0 }, 0, Math.PI / 2, 0);

    expect(rotated.x).toBeCloseTo(0, 5);
    expect(rotated.z).toBeCloseTo(-1, 5);
    expect(rotated.y).toBeCloseTo(0, 5);
  });

  it("projects points smaller as they move away from the camera", () => {
    const near = projectVertex({ x: 0, y: 0, z: 0 }, 4, 400, 400, 300);
    const far = projectVertex({ x: 0, y: 0, z: 2 }, 4, 400, 400, 300);

    expect(near.invZ).toBeGreaterThan(far.invZ);
    expect(near.x).toBeCloseTo(400, 5);
    expect(near.y).toBeCloseTo(300, 5);
  });
});
