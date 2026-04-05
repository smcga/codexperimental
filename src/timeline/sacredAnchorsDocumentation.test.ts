import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";


describe("sacred musical anchor documentation", () => {
  it("keeps the anchor source-of-truth document and AGENTS guidance impossible to miss", () => {
    const anchorsDoc = readFileSync(new URL("../../docs/sacred-musical-anchors.md", import.meta.url), "utf-8");
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf-8");
    const agents = readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf-8");

    expect(readme).toContain("docs/sacred-musical-anchors.md");
    expect(agents).toContain("Sacred musical anchors (absolute priority)");
    expect(agents).toContain("must not drift");
    expect(anchorsDoc).toContain("total runtime locked at **06:22.87**");

    const requiredAnchors = [
      "00:00",
      "00:23",
      "00:54.2",
      "01:16.62",
      "01:22",
      "01:26",
      "01:27.4",
      "01:35.6",
      "01:36.9",
      "01:38.3",
      "01:49.16",
      "02:00",
      "02:10.8",
      "02:25.9",
      "02:27",
      "02:32.5",
      "02:37.8",
      "02:43.3",
      "02:49",
      "02:51",
      "02:53.8",
      "03:09.6",
      "03:15.7",
      "03:24",
      "03:25.14",
      "04:25.7",
      "04:30.9",
      "04:40.7",
      "04:51.5",
      "05:02.6",
      "05:19.66",
      "05:25.28",
      "05:40.0",
      "05:59.3",
      "06:00.4",
      "06:12.8",
      "06:22.87"
    ];

    requiredAnchors.forEach((anchor) => {
      expect(anchorsDoc).toContain(`**${anchor}**`);
    });
  });
});
