import { describe, expect, it } from "vitest";

import { projectPoint, rotateY } from "./simple3d";

describe("simple3d math helpers", () => {
  it("rotates points around the Y axis", () => {
    const rotated = rotateY({ x: 1, y: 0, z: 0 }, Math.PI / 2);

    expect(rotated.x).toBeCloseTo(0, 5);
    expect(rotated.z).toBeCloseTo(-1, 5);
    expect(rotated.y).toBeCloseTo(0, 5);
  });

  it("projects points smaller as they move away from the camera", () => {
    const near = projectPoint({ x: 0, y: 0, z: 0 }, 6, 400, 800, 600);
    const far = projectPoint({ x: 0, y: 0, z: 2 }, 6, 400, 800, 600);

    expect(near.scale).toBeGreaterThan(far.scale);
    expect(near.x).toBeCloseTo(400, 5);
    expect(near.y).toBeCloseTo(300, 5);
  });
});
