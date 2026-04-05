import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("sacred musical anchor documentation", () => {
  it("keeps primary anchors and secondary switch cues documented with correct priority", () => {
    const anchorsDoc = readFileSync(new URL("../../docs/sacred-musical-anchors.md", import.meta.url), "utf-8");
    const readme = readFileSync(new URL("../../README.md", import.meta.url), "utf-8");
    const agents = readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf-8");

    expect(readme).toContain("docs/sacred-musical-anchors.md");
    expect(readme).toContain("secondary effect-switch cues");

    expect(agents).toContain("Sacred musical anchors (absolute priority)");
    expect(agents).toContain("must not drift");
    expect(agents).toContain("advisory only");

    expect(anchorsDoc).toContain("total runtime locked at **06:22.87**");
    expect(anchorsDoc).toContain("Primary priority (absolute)");
    expect(anchorsDoc).toContain("Secondary priority (advisory)");
    expect(anchorsDoc).toContain("Secondary effect-switch timing cues");

    const requiredPrimaryAnchors = [
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

    requiredPrimaryAnchors.forEach((anchor) => {
      expect(anchorsDoc).toContain(`**${anchor}**`);
    });

    const requiredSecondarySwitchCues = [
      "00:59.90",
      "01:05.1",
      "01:13.2",
      "01:15.2",
      "01:15.56",
      "01:16.62",
      "01:22.07",
      "01:26.8",
      "01:27.07",
      "01:24.47",
      "01:30.17",
      "01:32.93",
      "01:35.6",
      "01:36.9",
      "01:37.47",
      "01:38.3",
      "01:41.0",
      "01:43.7",
      "01:44.2",
      "01:44.7",
      "01:45.26",
      "01:45.76",
      "01:46.09",
      "01:46.27",
      "01:48.56",
      "01:49.16",
      "01:53.61",
      "02:00.03",
      "02:04.7",
      "02:06.81",
      "02:08.24",
      "02:10.8",
      "02:16.2",
      "02:19.5",
      "02:22.4",
      "02:29.85",
      "02:32.5",
      "02:35.14",
      "02:37.6",
      "02:37.99",
      "02:40.7",
      "02:43.4",
      "02:46.07",
      "02:48.5",
      "02:49.3",
      "02:49.8",
      "02:50.3",
      "02:50.8",
      "02:51.1",
      "03:25.14",
      "03:26.1",
      "03:42.36",
      "04:00.4",
      "04:01.3",
      "04:25.7"
    ];

    requiredSecondarySwitchCues.forEach((cue) => {
      expect(anchorsDoc).toContain(`**${cue}**`);
    });
  });
});
