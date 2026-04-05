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
