import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { syncExplicitPixelsArtifacts } from "../scripts/generateExplicitPixels";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("syncExplicitPixelsArtifacts", () => {
  test("preserves frame source and updates metadata from committed bytes", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "explicit-pixels-"));
    tempDirs.push(tempRoot);

    const generatedDir = path.join(tempRoot, "src/generated");
    fs.mkdirSync(generatedDir, { recursive: true });

    const framePath = path.join(generatedDir, "explicitPixelsFrame.ts");
    const frameSource = [
      "export const W = 1 as const;",
      "export const H = 1 as const;",
      "",
      "export function applyExplicit_frameBytes(dst: Uint8ClampedArray): void {",
      "  dst[0] = 12;",
      "  dst[1] = 34;",
      "  dst[2] = 56;",
      "  dst[3] = 255;",
      "}"
    ].join("\n");

    fs.writeFileSync(framePath, frameSource, "utf8");

    syncExplicitPixelsArtifacts(tempRoot);

    expect(fs.readFileSync(framePath, "utf8")).toBe(frameSource);

    const metaPath = path.join(generatedDir, "explicitPixelsMeta.ts");
    const metaSource = fs.readFileSync(metaPath, "utf8");
    expect(metaSource).toContain("export const assignmentCount = 4;");
    expect(metaSource).toContain(`export const generatedFileBytes = ${Buffer.byteLength(frameSource, "utf8")};`);
  });
});
