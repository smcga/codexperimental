import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("automation editor layout styles", () => {
  it("keeps automation rows horizontally scrollable instead of clipping controls", () => {
    const css = readFileSync(resolve(process.cwd(), "src/style.css"), "utf8");

    expect(css).toContain(".editor-automation-list {");
    expect(css).toContain("overflow-x: auto;");
    expect(css).toContain(".editor-automation-header,");
    expect(css).toContain("min-width: 760px;");
  });
});
