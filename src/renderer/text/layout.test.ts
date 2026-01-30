import { describe, expect, it } from "vitest";
import { layoutSpans } from "./layout";

const measure = (text: string, span: { size: number }) => text.length * span.size * 0.5;

describe("layoutSpans", () => {
  it("computes total width and start positions for center align", () => {
    const spans = [
      { text: "AI", color: "#fff", size: 20, weight: "bold", font: "Courier" },
      { text: "…", color: "#aaa", size: 20, weight: "bold", font: "Courier" }
    ];
    const layout = layoutSpans(spans, "center", measure);
    expect(layout.totalWidth).toBe(30);
    expect(layout.startX).toBe(-15);
    expect(layout.spans[0].x).toBe(-15);
    expect(layout.spans[1].x).toBe(5);
  });

  it("computes start positions for right align", () => {
    const spans = [
      { text: "Hello", color: "#fff", size: 10, weight: "bold", font: "Courier" }
    ];
    const layout = layoutSpans(spans, "right", measure);
    expect(layout.totalWidth).toBe(25);
    expect(layout.startX).toBe(-25);
    expect(layout.spans[0].x).toBe(-25);
  });
});
