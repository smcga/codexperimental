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
  it("does not include the human-crafted version link in the main overlay", () => {
    const indexHtml = readFileSync(new URL("../index.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(indexHtml).not.toContain("overlay-organic-banner");
    expect(indexHtml).not.toContain('id="overlay-organic-link"');
    expect(indexHtml).not.toContain('href="/human-stuff/index.html"');
    expect(css).not.toContain(".overlay-organic-banner");
    expect(css).not.toContain(".overlay-organic-banner a");
  });
});

describe("editor playlist scrollbar styling", () => {
  it("hides the native scrollbars so only the custom playlist scrollbar is shown", () => {
    const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");

    expect(css).toContain(".editor-playlist-scroll");
    expect(css).toContain("scrollbar-width: none;");
    expect(css).toContain("-ms-overflow-style: none;");
    expect(css).toContain(".editor-playlist-scroll::-webkit-scrollbar");
    expect(css).toContain("width: 0;");
    expect(css).toContain("height: 0;");
  });
});
