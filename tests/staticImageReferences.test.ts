import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(entryPath, out);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".ts")) {
      out.push(entryPath);
    }
  }
  return out;
}

describe("static image references", () => {
  test("all image assets referenced via new URL() exist on disk", () => {
    const sourceFiles = collectSourceFiles(srcRoot);
    const urlPattern = /new URL\("([^\"]+\.(?:png|jpg|jpeg|webp|gif|svg))",\s*import\.meta\.url\)/g;

    const missing: string[] = [];
    let referenceCount = 0;

    for (const sourceFile of sourceFiles) {
      const source = fs.readFileSync(sourceFile, "utf8");
      for (const match of source.matchAll(urlPattern)) {
        referenceCount += 1;
        const relativeAssetPath = match[1];
        const resolvedAssetPath = path.resolve(path.dirname(sourceFile), relativeAssetPath);
        if (!fs.existsSync(resolvedAssetPath)) {
          missing.push(`${path.relative(repoRoot, sourceFile)} -> ${relativeAssetPath}`);
        }
      }
    }

    expect(referenceCount).toBeGreaterThanOrEqual(0);
    expect(missing).toEqual([]);
  });
});
