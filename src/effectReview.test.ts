import { describe, expect, it } from "vitest";

import { formatEffectReviewTimestamp, getEffectReviewPageParams } from "./effectReview";

describe("effect review page helpers", () => {
  it("reads id and token from the query string", () => {
    expect(getEffectReviewPageParams("?id=effect-1&token=secret-token")).toEqual({
      id: "effect-1",
      token: "secret-token"
    });
  });

  it("formats timestamps for moderation metadata", () => {
    const formatted = formatEffectReviewTimestamp(Date.UTC(2024, 0, 2, 3, 4, 0));
    expect(formatted.length).toBeGreaterThan(0);
  });
});
