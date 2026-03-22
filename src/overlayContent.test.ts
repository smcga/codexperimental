import { describe, expect, it } from "vitest";

import { getOverlayPresentation } from "./overlayContent";

describe("getOverlayPresentation", () => {
  it("keeps the start overlay focused on starting and sharing", () => {
    expect(getOverlayPresentation("start")).toMatchObject({
      kicker: "browser invitro // live signal",
      title: "Enter the signal",
      startLabel: "Start demo",
      shareLabel: "Spread the signal",
      showActions: true,
      showStart: true,
      showShare: true,
      showRestart: false,
      showDoodle: false
    });
  });

  it("hides overlay actions during status messages", () => {
    expect(getOverlayPresentation("status")).toMatchObject({
      kicker: "system status",
      showActions: false,
      showStart: false,
      showShare: false,
      showRestart: false,
      showDoodle: false
    });
  });

  it("switches the end overlay into replay/share mode", () => {
    expect(getOverlayPresentation("end")).toMatchObject({
      kicker: "signal complete",
      title: "The end",
      subtitle: "Replay it, tag the crew, or leave a doodle for the wall.",
      showActions: true,
      showStart: false,
      showShare: true,
      showRestart: true,
      showDoodle: true
    });
  });
});
