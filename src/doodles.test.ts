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

  it("fetches and caches doodles", async () => {
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

  it("submits doodles and refreshes the cache", async () => {
    globalThis.fetch = vi.fn(async (_input, init) => ({
      ok: true,
      status: 200,
      json: async () => ({
        doodles: [{ id: String(init?.method), imageData: "data:image/png;base64,def", createdAt: 2 }]
      })
    })) as typeof fetch;

    await expect(submitDoodle("data:image/png;base64,def")).resolves.toEqual([
      { id: "POST", imageData: "data:image/png;base64,def", createdAt: 2 }
    ]);
    expect(getCachedDoodles()).toEqual([{ id: "POST", imageData: "data:image/png;base64,def", createdAt: 2 }]);
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
