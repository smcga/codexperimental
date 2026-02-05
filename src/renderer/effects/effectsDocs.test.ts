import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateEffectsDoc, getRegistryEffectNames } from "./effectsDocGenerator";

describe("effects docs", () => {
  it("matches the effect registry", () => {
    const registryNames = getRegistryEffectNames();
    const { effectNames } = generateEffectsDoc();
    expect(effectNames.sort()).toEqual(registryNames.sort());
  });

  it("is up to date with generated output", () => {
    const docsPath = path.resolve(process.cwd(), "docs/effects.md");
    const { markdown } = generateEffectsDoc();
    const current = fs.readFileSync(docsPath, "utf-8");
    expect(current).toBe(markdown);
  });
});
