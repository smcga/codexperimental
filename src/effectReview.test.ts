import { describe, expect, it } from "vitest";

import {
  formatEffectReviewTimestamp,
  getEffectReviewActionStates,
  getEffectReviewPageParams,
  getNextPendingEffectId
} from "./effectReview";

describe("effect review page helpers", () => {
  it("reads id and token from the query string", () => {
    expect(getEffectReviewPageParams("?id=effect-1&token=secret-token")).toEqual({
      id: "effect-1",
      token: "secret-token"
    });
  });


  it("builds approve and deny action links when moderation can proceed", () => {
    expect(getEffectReviewActionStates(true, "effect-1", "secret token")).toEqual([
      { action: "approve", href: "/api/effects?action=approve&id=effect-1&token=secret+token", disabled: false },
      { action: "reject", href: "/api/effects?action=reject&id=effect-1&token=secret+token", disabled: false }
    ]);
  });

  it("disables approve and deny actions when moderation context is missing", () => {
    expect(getEffectReviewActionStates(false, null, null)).toEqual([
      { action: "approve", href: "#", disabled: true },
      { action: "reject", href: "#", disabled: true }
    ]);
  });

  it("formats timestamps for moderation metadata", () => {
    const formatted = formatEffectReviewTimestamp(Date.UTC(2024, 0, 2, 3, 4, 0));
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("picks the next pending effect after approval", () => {
    expect(getNextPendingEffectId([{ id: "a" }, { id: "b" }, { id: "c" }], "a", "approve")).toBe("b");
  });

  it("picks the first pending effect after rejection", () => {
    expect(getNextPendingEffectId([{ id: "b" }, { id: "c" }], "a", "reject")).toBe("b");
  });
});
