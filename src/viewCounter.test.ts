import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchViews, registerViewOncePerSession } from "./viewCounter";

const createStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  } as Storage;
};

describe("viewCounter", () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = globalThis.sessionStorage;

  beforeEach(() => {
    globalThis.sessionStorage = createStorage();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalStorage;
    vi.restoreAllMocks();
  });

  it("fetchViews returns count on success", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 12 })
    })) as typeof fetch;

    await expect(fetchViews()).resolves.toBe(12);
  });

  it("fetchViews returns 0 on failure", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({ count: 5 })
    })) as typeof fetch;

    await expect(fetchViews()).resolves.toBe(0);
  });

  it("registerViewOncePerSession posts and caches the count", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 7 })
    })) as typeof fetch;

    await expect(registerViewOncePerSession()).resolves.toBe(7);
    expect(globalThis.sessionStorage.getItem("viewCounted")).toBe("1");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("registerViewOncePerSession skips when already counted", async () => {
    globalThis.sessionStorage.setItem("viewCounted", "1");
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ count: 9 })
    })) as typeof fetch;

    await expect(registerViewOncePerSession()).resolves.toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
