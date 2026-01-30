import { describe, expect, it } from "vitest";
import { layoutTextSpans } from "./textRenderer";

describe("layoutTextSpans", () => {
  const measure = (text: string, size: number) => text.length * size;

  it("centers spans with correct offsets", () => {
    const result = layoutTextSpans(
      [
        { text: "Hello", color: "#fff" },
        { text: "World", color: "#fff" }
      ],
      10,
      "center",
      measure
    );

    expect(result.totalWidth).toBe(100);
    expect(result.startX).toBe(-50);
    expect(result.spans[0].x).toBe(-50);
    expect(result.spans[1].x).toBe(0);
  });

  it("right aligns spans", () => {
    const result = layoutTextSpans(
      [
        { text: "Hi", color: "#fff" },
        { text: "!", color: "#fff" }
      ],
      10,
      "right",
      measure
    );

    expect(result.totalWidth).toBe(30);
    expect(result.startX).toBe(-30);
    expect(result.spans[0].x).toBe(-30);
    expect(result.spans[1].x).toBe(-10);
  });
});
