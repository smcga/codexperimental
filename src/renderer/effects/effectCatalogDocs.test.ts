import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const readEffectCatalog = (): string[] => {
  const readmePath = path.resolve(process.cwd(), "README.md");
  const readme = fs.readFileSync(readmePath, "utf-8");
  const marker = "### Effect catalog";
  const markerIndex = readme.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("README.md is missing the Effect catalog section.");
  }
  const afterMarker = readme.slice(markerIndex + marker.length);
  const section = afterMarker.split("\n## ")[0] ?? "";
  const rows = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .filter((line) => !line.includes("---"))
    .filter((line) => !line.includes("Effect"));
  return rows
    .map((line) => line.split("|")[1]?.trim())
    .filter((value): value is string => Boolean(value));
};

const readRegistryEffects = (): string[] => {
  const registryPath = path.resolve(process.cwd(), "src/renderer/effects/index.ts");
  const registrySource = fs.readFileSync(registryPath, "utf-8");
  const marker = "export const effectRegistry";
  const markerIndex = registrySource.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("Effect registry definition not found.");
  }
  const afterMarker = registrySource.slice(markerIndex);
  const section = afterMarker.split("};")[0] ?? "";
  const lines = section.split("\n");
  const effects: string[] = [];
  lines.forEach((line) => {
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      effects.push(match[1]);
    }
  });
  return effects;
};

const readAudioTimelineSection = (): string => {
  const readmePath = path.resolve(process.cwd(), "README.md");
  const readme = fs.readFileSync(readmePath, "utf-8");
  const marker = "## Audio + timeline configuration";
  const markerIndex = readme.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("README.md is missing the Audio + timeline configuration section.");
  }
  const afterMarker = readme.slice(markerIndex + marker.length);
  return afterMarker.split("\n### Effect catalog")[0] ?? "";
};

describe("README effect catalog", () => {
  it("lists each effect registry entry", () => {
    const catalogEffects = readEffectCatalog();
    const registryEffects = readRegistryEffects();
    const normalizedCatalog = catalogEffects.map((effect) => effect.replace(/`/g, ""));
    const missing = registryEffects.filter((effect) => !normalizedCatalog.includes(effect));
    const extra = normalizedCatalog.filter((effect) => !registryEffects.includes(effect));

    expect(missing).toEqual([]);
    expect(extra).toEqual([]);
  });

  it("documents WebGL effect highlights in the timeline section", () => {
    const section = readAudioTimelineSection();
    expect(section).toContain("`neon_alley`");
    expect(section).toContain("`space_hangar`");
    expect(section).toContain("### Timeline data schema");
    expect(section).toContain('"audio"');
    expect(section).toContain('"intro"');
    expect(section).toContain('"sections"');
    expect(section).toContain('"textCues"');
  });
});
