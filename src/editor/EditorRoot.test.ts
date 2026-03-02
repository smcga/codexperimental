import { describe, expect, it } from "vitest";
import { computeSceneSeekTime } from "./EditorRoot";

describe("computeSceneSeekTime", () => {
  it("subtracts audio offset from the scene start", () => {
    expect(computeSceneSeekTime(18.5, 2)).toBe(16.5);
  });

  it("clamps to zero when offset exceeds scene start", () => {
    expect(computeSceneSeekTime(1, 4)).toBe(0);
  });

  it("accepts scene start values provided as timeline strings", () => {
    expect(computeSceneSeekTime("00:12.5", 2.5)).toBe(10);
  });
});
