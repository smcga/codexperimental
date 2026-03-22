import { describe, expect, it } from "vitest";
import { formatReviewTimestamp, getReviewPageParams } from "./doodleReview";

describe("doodle review helpers", () => {
  it("reads the review id and token from the query string", () => {
    expect(getReviewPageParams("?id=pending-1&token=secret-token")).toEqual({
      id: "pending-1",
      token: "secret-token"
    });
  });

  it("returns null values when the review query is incomplete", () => {
    expect(getReviewPageParams("?id=pending-1")).toEqual({
      id: "pending-1",
      token: null
    });
  });

  it("formats the doodle submission timestamp for display", () => {
    expect(formatReviewTimestamp(Date.UTC(2024, 0, 2, 3, 4))).toMatch(/2024|Jan|January/);
  });
});
