import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("automation editor layout styles", () => {
  it("keeps automation rows responsive so inspector content fits without horizontal scrolling", () => {
    const css = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(css).toContain(".editor-automation-list {");
    expect(css).toContain("min-width: 0;");
    expect(css).toContain("@media (max-width: 1100px)");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(css).toContain(".editor-layer-actions {");
    expect(css).toContain("flex-wrap: wrap;");
    expect(css).toContain(".editor-playlist-vscrollbar {");
    expect(css).toContain(".editor-playlist-scrollbar-handle-start {");
    expect(css).toContain("grid-template-columns: minmax(170px, 210px) minmax(0, 2.45fr) minmax(260px, 1fr);");
    expect(css).toContain("min-height: clamp(280px, 42vh, 520px);");
  });
});
