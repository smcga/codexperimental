import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateTransitionsDoc, getDocumentedTransitions } from "./transitionsDocGenerator";

describe("transitions docs", () => {
  it("matches the transition registry", () => {
    const documentedTransitions = getDocumentedTransitions();
    const { transitions } = generateTransitionsDoc();
    expect(transitions).toEqual(documentedTransitions);
  });

  it("is up to date with generated output", () => {
    const docsPath = path.resolve(process.cwd(), "docs/Transitions.md");
    const { markdown } = generateTransitionsDoc();
    const current = fs.readFileSync(docsPath, "utf-8");
    expect(current).toBe(markdown);
  });
});
