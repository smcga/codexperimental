import { describe, expect, it, vi } from "vitest";
import { Starfield } from "./starfield";

describe("Starfield", () => {
  it("applies lateral drift when turning", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const starfield = new Starfield(1, 2);
    const stars = (starfield as unknown as { stars: Array<{ x: number; y: number }> }).stars;
    const initialX = stars[0].x;
    const initialY = stars[0].y;

    starfield.update(1, 0.1, 0.6);

    expect(stars[0].x).toBeGreaterThan(initialX);
    expect(stars[0].y).toBeGreaterThan(initialY);
    randomSpy.mockRestore();
  });

  it("keeps stars aligned when turn strength is zero", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const starfield = new Starfield(1, 2);
    const stars = (starfield as unknown as { stars: Array<{ x: number; y: number }> }).stars;
    const initialX = stars[0].x;
    const initialY = stars[0].y;

    starfield.update(0.5, 0.1, 0);

    expect(stars[0].x).toBe(initialX);
    expect(stars[0].y).toBe(initialY);
    randomSpy.mockRestore();
  });
});
