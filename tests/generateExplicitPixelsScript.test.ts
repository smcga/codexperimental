import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, describe, expect, test } from "vitest";

const repoRoot = process.cwd();
const scriptPath = path.resolve(repoRoot, "scripts/generateExplicitPixels.ts");
const tsxBinPath = path.resolve(repoRoot, "node_modules", ".bin", "tsx");

const tempDirs: string[] = [];

function makeTempProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "explicit-pixels-script-"));
  tempDirs.push(dir);
  fs.mkdirSync(path.join(dir, "src", "generated"), { recursive: true });
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("generateExplicitPixels script", () => {
  test("keeps an existing frame file untouched and refreshes metadata", () => {
    const projectDir = makeTempProject();
    const framePath = path.join(projectDir, "src", "generated", "explicitPixelsFrame.ts");
    const metaPath = path.join(projectDir, "src", "generated", "explicitPixelsMeta.ts");

    const existingFrame = [
      "export const W = 1;",
      "export const H = 1;",
      "",
      "export function applyExplicit(data: Uint8ClampedArray): void {",
      "  data[0] = 1;",
      "  data[1] = 2;",
      "  data[2] = 3;",
      "  data[3] = 255;",
      "}"
    ].join("\n");

    fs.writeFileSync(framePath, `${existingFrame}\n`, "utf8");

    execFileSync(tsxBinPath, [scriptPath], {
      cwd: projectDir,
      stdio: "pipe"
    });

    expect(fs.readFileSync(framePath, "utf8")).toBe(`${existingFrame}\n`);

    const metaSource = fs.readFileSync(metaPath, "utf8");
    expect(metaSource).toContain("export const assignmentCount = 4;");
    expect(metaSource).toContain(`export const generatedFileBytes = ${Buffer.byteLength(`${existingFrame}\n`, "utf8")};`);
  });
});
