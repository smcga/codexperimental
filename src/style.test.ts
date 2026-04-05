import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("effect idea modal styling", () => {
  it("enables vertical scrolling only for the generate effect panel", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(css).toContain("#effect-idea-modal .doodle-panel");
    expect(css).toContain("max-height: min(92vh, 56rem);");
    expect(css).toContain("overflow-y: auto;");
    expect(css).toContain("overscroll-behavior: contain;");
  });
});
