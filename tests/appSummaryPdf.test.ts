import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("app summary PDF", () => {
  it("exists and is a single-page PDF with expected summary sections", () => {
    const pdf = readFileSync("docs/app-summary.pdf", "latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("/Count 1");
    expect(pdf).toContain("What it is");
    expect(pdf).toContain("Who it is for");
    expect(pdf).toContain("How it works");
    expect(pdf).toContain("How to run");
  });
});
