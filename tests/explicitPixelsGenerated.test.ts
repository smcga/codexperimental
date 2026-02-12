import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { assignmentCount, generatedFileBytes } from "../src/generated/explicitPixelsMeta";
import { H, W } from "../src/generated/explicitPixelsFrame";

describe("explicit pixels generated frame", () => {
  test("generated function keeps pure assignment style", () => {
    const framePath = path.resolve(process.cwd(), "src/generated/explicitPixelsFrame.ts");
    const frameSource = fs.readFileSync(framePath, "utf8");

    expect(frameSource).toContain("export function applyExplicit_frameBytes(dst: Uint8ClampedArray): void");
    expect(frameSource).not.toContain("for (");
    expect(frameSource).not.toContain("while (");
    expect(frameSource).not.toContain(".map(");
    expect(frameSource).not.toContain(".forEach(");

    const matches = frameSource.match(/(?:data|dst)\[/g) ?? [];
    expect(matches.length).toBe(W * H * 4);
    expect(assignmentCount).toBe(matches.length);
    expect(generatedFileBytes).toBeGreaterThan(10_000);
    expect(generatedFileBytes).toBe(Buffer.byteLength(frameSource, "utf8"));
  });
});
