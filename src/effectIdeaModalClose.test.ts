import { describe, expect, it } from "vitest";
import { getEffectIdeaCloseBlockedMessage } from "./effectIdeaModalClose";

describe("getEffectIdeaCloseBlockedMessage", () => {
  it("blocks closing while generation is running", () => {
    expect(getEffectIdeaCloseBlockedMessage(true)).toContain("Generation is still running");
  });

  it("allows closing when generation is idle", () => {
    expect(getEffectIdeaCloseBlockedMessage(false)).toBeNull();
  });
});
