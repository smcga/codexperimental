import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearDoodleCache, fetchDoodles, getCachedDoodles, submitDoodle } from "./doodles";

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
        moderationStatus: "pending"
      })
    })) as typeof fetch;

    await expect(submitDoodle("data:image/png;base64,def")).resolves.toEqual({
      doodle: { id: "pending-1", imageData: "data:image/png;base64,def", createdAt: 2 },
      moderationStatus: "pending"
    });
    expect(getCachedDoodles()).toEqual([]);
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
