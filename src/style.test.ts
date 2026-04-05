import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("effect idea modal styling", () => {
  it("enables vertical scrolling only for the generate effect panel", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(css).toContain("#effect-idea-modal .doodle-panel");
    expect(css).toContain("max-height: min(92vh, 56rem);");
    expect(css).toContain("overflow-y: auto;");
    expect(css).toContain("overscroll-behavior: contain;");
  });

  it("shows a clear animated busy state for generating effect ideas", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(css).toContain(".doodle-actions button:disabled");
    expect(css).toContain("#effect-idea-generate.is-busy::after");
    expect(css).toContain("#effect-idea-status[data-state=\"busy\"]::after");
    expect(css).toContain("@keyframes effect-idea-button-spin");
  });
});

describe("start overlay organic link", () => {
  it("includes a subtle link to the deployed human-crafted version", () => {
    const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
    const humanVersion = readFileSync(new URL("../public/human-stuff/index.html", import.meta.url), "utf8");

    expect(indexHtml).toContain("overlay-organic-banner");
    expect(indexHtml).toContain('id="overlay-organic-link"');
    expect(indexHtml).toContain('href="/human-stuff/index.html"');
    expect(css).toContain(".overlay-organic-banner");
    expect(css).toContain(".overlay-organic-banner a");
    expect(humanVersion).toContain("welcome to the human zone");
  });
});
