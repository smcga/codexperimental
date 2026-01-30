import { describe, expect, it } from "vitest";
import { layoutCueSpans } from "./textRenderer";
import { NormalizedTextSpan } from "../../config/loadConfig";

const measure = (text: string) => text.length;

describe("layoutCueSpans", () => {
  it("calculates total width and positions for centered spans", () => {
    const spans: NormalizedTextSpan[] = [
      { text: "Hello", color: "#fff" },
      { text: "World", color: "#fff" }
    ];
    const result = layoutCueSpans(spans, 1, "center", (text) => measure(text));
    expect(result.totalWidth).toBe(11);
    expect(result.spans[0].x).toBe(-5.5);
    expect(result.spans[1].x).toBe(-0.5);
  });

  it("calculates positions for right aligned spans", () => {
    const spans: NormalizedTextSpan[] = [
      { text: "A", color: "#fff" },
      { text: "B", color: "#fff" }
    ];
    const result = layoutCueSpans(spans, 1, "right", (text) => measure(text));
    expect(result.totalWidth).toBe(3);
    expect(result.spans[0].x).toBe(-3);
    expect(result.spans[1].x).toBe(-2);
  });
});
