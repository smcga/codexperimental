import { describe, expect, it } from "vitest";

import { getOverlayPresentation } from "./overlayContent";

describe("getOverlayPresentation", () => {
  it("keeps the start overlay focused on starting and sharing", () => {
    expect(getOverlayPresentation("start")).toMatchObject({
      kicker: "browser invitro // everything is computed",
      title: "Enter the signal",
      echo: "real-time. no playback.",
      subtitle: "audio active\nclick anywhere or press start",
      startLabel: "Execute",
      shareLabel: "Spread the signal",
      showActions: true,
      showStart: true,
      showShare: true,
      showRestart: false,
      showDoodle: false,
      showEffectIdea: false
    });
  });

  it("hides overlay actions during status messages", () => {
    expect(getOverlayPresentation("status")).toMatchObject({
      kicker: "system status",
      echo: "",
      showActions: false,
      showStart: false,
      showShare: false,
      showRestart: false,
      showDoodle: false,
      showEffectIdea: false
    });
  });

  it("switches the end overlay into replay/share mode", () => {
    expect(getOverlayPresentation("end")).toMatchObject({
      kicker: "signal complete",
      title: "The end",
      echo: "",
      subtitle: "Replay it, tag the crew, or leave a doodle for the wall.",
      shareLabel: "Spread the signal",
      effectIdeaLabel: "Got an effect idea? Make it real!",
      showActions: true,
      showStart: false,
      showShare: true,
      showRestart: true,
      showDoodle: true,
      showEffectIdea: true
    });
  });
});
