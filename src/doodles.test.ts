import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildModerationActionUrl,
  clearDoodleCache,
  fetchDoodles,
  fetchPendingDoodle,
  getCachedDoodles,
  submitDoodle
} from "./doodles";

describe("doodles client", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearDoodleCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    clearDoodleCache();
  });

  it("fetches and caches approved doodles", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        doodles: [{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }]
      })
    })) as typeof fetch;

    await expect(fetchDoodles()).resolves.toEqual([{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }]);
    await expect(fetchDoodles()).resolves.toEqual([{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(getCachedDoodles()).toHaveLength(1);
  });

  it("returns pending moderation info after submitting a doodle", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        doodle: { id: "pending-1", imageData: "data:image/png;base64,def", createdAt: 2 },
        moderationStatus: "pending",
        reviewUrl: "/review.html?id=pending-1&token=secret-token"
      })
    })) as typeof fetch;

    await expect(submitDoodle("data:image/png;base64,def")).resolves.toEqual({
      doodle: { id: "pending-1", imageData: "data:image/png;base64,def", createdAt: 2 },
      moderationStatus: "pending",
      reviewUrl: "/review.html?id=pending-1&token=secret-token"
    });
    expect(getCachedDoodles()).toEqual([]);
  });

  it("fetches a pending doodle for the review page", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        doodle: { id: "pending-2", imageData: "data:image/png;base64,ghi", createdAt: 3 },
        reviewUrl: "/review.html?id=pending-2&token=secret-token"
      })
    })) as typeof fetch;

    await expect(fetchPendingDoodle("pending-2", "secret-token")).resolves.toEqual({
      doodle: { id: "pending-2", imageData: "data:image/png;base64,ghi", createdAt: 3 },
      reviewUrl: "/review.html?id=pending-2&token=secret-token"
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/doodles?pendingId=pending-2&token=secret-token",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("builds moderation action URLs for the review buttons", () => {
    expect(buildModerationActionUrl("approve", "pending-3", "secret token")).toBe(
      "/api/doodles?action=approve&id=pending-3&token=secret+token"
    );
    expect(buildModerationActionUrl("reject", "pending-3", "secret token")).toBe(
      "/api/doodles?action=reject&id=pending-3&token=secret+token"
    );
  });

  it("returns the existing cache if a refresh fails", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ doodles: [{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }] })
      })
      .mockRejectedValueOnce(new Error("offline")) as typeof fetch;

    await expect(fetchDoodles()).resolves.toEqual([{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }]);
    await expect(fetchDoodles(true)).resolves.toEqual([{ id: "1", imageData: "data:image/png;base64,abc", createdAt: 1 }]);
  });
});
