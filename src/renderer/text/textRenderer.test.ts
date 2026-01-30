import { describe, expect, it } from "vitest";
import { layoutSpans } from "./textRenderer";

const measure = (text: string, size: number) => text.length * size * 0.5;

describe("layoutSpans", () => {
  it("centers spans correctly", () => {
    const layout = layoutSpans(
      [
        { text: "AI" },
        { text: "2022" }
      ],
      20,
      "center",
      100,
      (text, size) => measure(text, size)
    );

    expect(layout.totalWidth).toBeCloseTo(60, 2);
    expect(layout.startX).toBeCloseTo(70, 2);
    expect(layout.spans[0].x).toBeCloseTo(70, 2);
    expect(layout.spans[1].x).toBeCloseTo(90, 2);
  });

  it("right aligns spans correctly", () => {
    const layout = layoutSpans(
      [{ text: "HELLO" }],
      10,
      "right",
      80,
      (text, size) => measure(text, size)
    );

    expect(layout.totalWidth).toBeCloseTo(25, 2);
    expect(layout.startX).toBeCloseTo(55, 2);
    expect(layout.spans[0].x).toBeCloseTo(55, 2);
  });
});
