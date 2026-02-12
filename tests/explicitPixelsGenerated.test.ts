import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { assignmentCount, generatedFileBytes } from "../src/generated/explicitPixelsMeta";
import { H, W } from "../src/generated/explicitPixelsFrame";

describe("explicit pixels generated frame", () => {
  test("generated function exposes committed-frame API and metadata stays in sync", () => {
    const framePath = path.resolve(process.cwd(), "src/generated/explicitPixelsFrame.ts");
    const frameSource = fs.readFileSync(framePath, "utf8");

    expect(frameSource).toContain("export function applyExplicit_frameBytes(dst: Uint8ClampedArray): void");
    expect(frameSource).toContain("dst.set(FRAME_BYTES);");

    expect(assignmentCount).toBe(W * H * 4);
    expect(generatedFileBytes).toBeGreaterThan(10_000);
    expect(generatedFileBytes).toBe(Buffer.byteLength(frameSource, "utf8"));
  });
});
