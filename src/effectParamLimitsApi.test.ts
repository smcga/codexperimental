import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGlobalEffectParamLimits, saveGlobalEffectParamLimits } from "./effectParamLimitsApi";

describe("effectParamLimitsApi", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("fetches and sanitizes param limits", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        paramLimits: {
          starfield: {
            speed: { min: -2, max: 8 },
            warp: { min: "bad", max: 10 }
          }
        }
      })
    })) as typeof fetch;

    await expect(fetchGlobalEffectParamLimits()).resolves.toEqual({
      starfield: {
        speed: { min: -2, max: 8 },
        warp: { min: undefined, max: 10 }
      }
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?action=paramLimits",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("posts limits and returns sanitized server response", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        paramLimits: {
          flyover: {
            speed: { min: -3, max: 9 }
          }
        }
      })
    })) as typeof fetch;

    await expect(
      saveGlobalEffectParamLimits({
        flyover: {
          speed: { min: -3, max: 9 }
        }
      })
    ).resolves.toEqual({
      flyover: {
        speed: { min: -3, max: 9 }
      }
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?action=paramLimits",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("flyover")
      })
    );
  });
});
