import { describe, expect, it } from "vitest";
import { getEffectIdeaCloseBlockedMessage, shouldShowCommunityCarouselButtons } from "./effectIdeaModalClose";

describe("getEffectIdeaCloseBlockedMessage", () => {
  it("blocks closing while generation is running", () => {
    expect(getEffectIdeaCloseBlockedMessage(true)).toContain("Generation is still running");
  });

  it("allows closing when generation is idle", () => {
    expect(getEffectIdeaCloseBlockedMessage(false)).toBeNull();
  });
});

describe("shouldShowCommunityCarouselButtons", () => {
  it("shows carousel buttons while generation is running with enough entries", () => {
    expect(shouldShowCommunityCarouselButtons(true, false, 2)).toBe(true);
  });

  it("keeps carousel buttons visible while busy modal is open with enough entries", () => {
    expect(shouldShowCommunityCarouselButtons(false, true, 2)).toBe(true);
  });

  it("hides carousel buttons when there are fewer than two entries", () => {
    expect(shouldShowCommunityCarouselButtons(true, true, 1)).toBe(false);
  });
});
