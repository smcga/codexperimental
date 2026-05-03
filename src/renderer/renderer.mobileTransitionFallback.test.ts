import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Renderer mobile transition fallback wiring", () => {
  it("passes duration to drawMobileDefaultCrossfade in mobile transition fallback", () => {
    const source = readFileSync(join(process.cwd(), "src/renderer/renderer.ts"), "utf8");
    expect(source).toContain("this.drawMobileDefaultCrossfade(targetCtx, transition.progress, transition.duration, width, height);");
  });
});
