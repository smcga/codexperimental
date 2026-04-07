import process from "node:process";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRedis = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<unknown>;
  lrange: (key: string, start: number, stop: number) => Promise<unknown[]>;
  lpush: (key: string, value: unknown) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<"OK">;
};

const createResponse = () => {
  const headers = new Map<string, string>();
  let body = "";
  return {
    response: {
      statusCode: 0,
      setHeader: (key: string, value: string) => headers.set(key, value),
      end: (value = "") => {
        body = value;
      }
    },
    getBody: () => body
  };
};

function createMockRedis(initialApproved: unknown[] = [], initialPending: unknown[] = []): MockRedis {
  const approved = [...initialApproved];
  let pending = [...initialPending];
  const kv = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => {
      if (key === "effects:pending") {
        return pending;
      }
      return kv.has(key) ? kv.get(key) : null;
    }),
    set: vi.fn(async (key: string, value: unknown) => {
      if (key === "effects:pending") {
        pending = Array.isArray(value) ? [...value] : [];
        return "OK";
      }
      kv.set(key, value);
      return "OK";
    }),
    lrange: vi.fn(async (key: string) => (key === "effects:items" ? approved : [])),
    lpush: vi.fn(async (key: string, value: unknown) => {
      if (key === "effects:items") {
        approved.unshift(value);
      }
      return approved.length;
    }),
    ltrim: vi.fn(async (_key: string, _start: number, stop: number) => {
      approved.splice(stop + 1);
      return "OK";
    })
  };
}

describe("api/effects", () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.EFFECT_GENERATE_ALLOWLIST_IPS = "127.0.0.1";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          name: "Nebula",
          typescriptCode: "ts",
          runtimeCode: "return { render() {} };",
          params: [{ key: "speed", label: "Speed", type: "number", defaultValue: 0.5, min: 0, max: 1 }],
          docs: { description: "Generated effect", parameters: "- speed: movement speed." }
        })
      })
    })) as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("lists approved effects", async () => {
    const redis = createMockRedis([{ id: "a", name: "A", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 }]);
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({ method: "GET", url: "/api/effects" }, res.response);
    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).effects).toHaveLength(1);
  });

  it("stores and returns shared effect param limits", async () => {
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");

    const saveRes = createResponse();
    await handler({
      method: "POST",
      url: "/api/effects?action=paramLimits",
      body: JSON.stringify({
        paramLimits: {
          starfield: {
            speed: { min: -3, max: 9 },
            warp: { min: "bad", max: 4 }
          }
        }
      })
    }, saveRes.response);
    expect(saveRes.response.statusCode).toBe(200);
    expect(JSON.parse(saveRes.getBody()).paramLimits).toEqual({
      starfield: {
        speed: { min: -3, max: 9 },
        warp: { min: undefined, max: 4 }
      }
    });

    const readRes = createResponse();
    await handler({ method: "GET", url: "/api/effects?action=paramLimits" }, readRes.response);
    expect(readRes.response.statusCode).toBe(200);
    expect(JSON.parse(readRes.getBody()).paramLimits).toEqual({
      starfield: {
        speed: { min: -3, max: 9 },
        warp: { min: undefined, max: 4 }
      }
    });
  });

  it("stores submissions as pending", async () => {
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({
      method: "POST",
      url: "/api/effects",
      body: JSON.stringify({
        name: "A",
        prompt: "p",
        typescriptCode: "ts",
        runtimeCode: "return { render() {} };",
        params: [{ key: "speed", label: "Speed", type: "number", defaultValue: 1 }],
        docs: { description: "Doc", parameters: "- speed: speed." }
      })
    }, res.response);
    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).moderationStatus).toBe("pending");
    expect(JSON.parse(res.getBody()).effect.params).toEqual([{ key: "speed", label: "Speed", type: "number", defaultValue: 1 }]);
  });

  it("generates via OpenAI", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({
      method: "POST",
      url: "/api/effects?action=generate",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({ prompt: "make stars" })
    }, res.response);
    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).generation.name).toBe("Nebula");
    expect(JSON.parse(res.getBody()).generation.params).toEqual([
      { key: "speed", label: "Speed", type: "number", defaultValue: 0.5, min: 0, max: 1 }
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("runtimeCode MUST be plain JavaScript")
      })
    );
  });

  it("returns an error when OpenAI key is missing for generation", async () => {
    delete process.env.OPENAI_API_KEY;
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({
      method: "POST",
      url: "/api/effects?action=generate",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({ prompt: "make stars" })
    }, res.response);
    expect(res.response.statusCode).toBe(503);
    expect(JSON.parse(res.getBody()).error).toContain("OPENAI_API_KEY");
  });

  it("returns raw model output when generation response cannot be parsed", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ output_text: "I can help with that! First, let's discuss..." })
    })) as typeof fetch;
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({
      method: "POST",
      url: "/api/effects?action=generate",
      headers: { "x-forwarded-for": "127.0.0.1" },
      body: JSON.stringify({ prompt: "make stars" })
    }, res.response);
    expect(res.response.statusCode).toBe(503);
    const payload = JSON.parse(res.getBody());
    expect(payload.error).toContain("Unable to parse generated effect response.");
    expect(payload.rawResponse).toContain("I can help with that");
  });

  it("records generation failures in monitoring metrics and exposes them via authorized endpoint", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    delete process.env.OPENAI_API_KEY;
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");

    const generate = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars" })
      },
      generate.response
    );
    expect(generate.response.statusCode).toBe(503);

    const metrics = createResponse();
    await handler(
      { method: "GET", url: "/api/effects?action=generateMetrics&token=secret-token" },
      metrics.response
    );
    expect(metrics.response.statusCode).toBe(200);
    const payload = JSON.parse(metrics.getBody());
    expect(payload.generateMetrics).toEqual(
      expect.objectContaining({
        totalRequests: 1,
        failedRequests: 1,
        acceptedRequests: 0
      })
    );
    expect(payload.generateMetrics.failureCategoryCounts.openai_config).toBe(1);
    expect(payload.recentGenerateErrors).toHaveLength(1);
    expect(payload.recentGenerateErrors[0]).toEqual(
      expect.objectContaining({
        httpStatus: 503,
        category: "openai_config"
      })
    );
  });

  it("requires authorization for generate monitoring endpoint", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({ method: "GET", url: "/api/effects?action=generateMetrics" }, res.response);
    expect(res.response.statusCode).toBe(401);
    expect(JSON.parse(res.getBody()).error).toBe("Unauthorized.");
  });

  it("sends a generation failure alert and applies category cooldown", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    process.env.EFFECT_GENERATE_ALERT_NTFY_URL = "https://ntfy.sh/effect-generate-alerts";
    process.env.EFFECT_GENERATE_ALERT_NTFY_TOKEN = "alert-token";
    process.env.EFFECT_GENERATE_ALERT_COOLDOWN_MS = "600000";
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) })) as typeof fetch;
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");

    const first = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars" })
      },
      first.response
    );
    expect(first.response.statusCode).toBe(503);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://ntfy.sh/effect-generate-alerts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Title: "Effect generate alert (openai_config)",
          Priority: "high",
          Authorization: "Bearer alert-token"
        }),
        body: expect.stringContaining("Category: openai_config")
      })
    );

    const second = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars again" })
      },
      second.response
    );
    expect(second.response.statusCode).toBe(503);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("sends ntfy moderation notifications for effect submissions", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    process.env.EFFECT_MODERATION_BASE_URL = "https://demo.example.com";
    process.env.EFFECT_MODERATION_NTFY_URL = "https://ntfy.sh/effect-topic";
    process.env.EFFECT_MODERATION_NTFY_TOKEN = "ntfy-token";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      {
        method: "POST",
        url: "/api/effects",
        body: JSON.stringify({ name: "Tunnel", prompt: "Fast tunnel", typescriptCode: "ts", runtimeCode: "return { render() {} };" })
      },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://ntfy.sh/effect-topic",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Title": "Effect idea awaiting approval",
          "Click": expect.stringContaining("/effect-review.html?id=")
        }),
        body: expect.stringContaining("Review: https://demo.example.com/effect-review.html?id=")
      })
    );
  });

  it("returns a single pending effect for the review page", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    process.env.EFFECT_MODERATION_BASE_URL = "https://demo.example.com";
    const redis = createMockRedis([], [{ id: "pending-1", name: "Tunnel", prompt: "Fast", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 }]);
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      { method: "GET", url: "/api/effects?pendingId=pending-1&token=secret-token" },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody())).toEqual({
      effect: { id: "pending-1", name: "Tunnel", prompt: "Fast", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 },
      reviewUrl: "https://demo.example.com/effect-review.html?id=pending-1&token=secret-token"
    });
  });

  it("keeps pending review fetch working when optional metadata shape drifts", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    process.env.EFFECT_MODERATION_BASE_URL = "https://demo.example.com";
    const redis = createMockRedis([], [
      {
        id: "pending-legacy",
        name: "Legacy",
        prompt: "Older payload format",
        code: "return { render() {} };",
        params: "bad-shape",
        docs: null,
        createdAt: 7
      }
    ]);
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      { method: "GET", url: "/api/effects?pendingId=pending-legacy&token=secret-token" },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody())).toEqual({
      effect: {
        id: "pending-legacy",
        name: "Legacy",
        prompt: "Older payload format",
        typescriptCode: "return { render() {} };",
        runtimeCode: "return { render() {} };",
        createdAt: 7
      },
      reviewUrl: "https://demo.example.com/effect-review.html?id=pending-legacy&token=secret-token"
    });
  });

  it("approves a pending effect through a signed one-tap link with HTML response", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    const redis = createMockRedis([], [{ id: "pending-1", name: "Tunnel", prompt: "Fast", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 }]);
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      { method: "GET", url: "/api/effects?action=approve&id=pending-1&token=secret-token" },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(res.getBody()).toContain("Effect approved");
    expect(redis.lpush).toHaveBeenCalledWith(
      "effects:items",
      expect.objectContaining({ id: "pending-1" })
    );
  });

  it("approves legacy pending effects through signed links", async () => {
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    const redis = createMockRedis([], [{ id: "pending-legacy", name: "Legacy", code: "return { render() {} };", createdAt: 1 }]);
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      { method: "GET", url: "/api/effects?action=approve&id=pending-legacy&token=secret-token" },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(redis.lpush).toHaveBeenCalledWith(
      "effects:items",
      expect.objectContaining({
        id: "pending-legacy",
        typescriptCode: "return { render() {} };",
        runtimeCode: "return { render() {} };"
      })
    );
  });

  it("allows generate for public users without auth gating", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.EFFECT_GENERATE_ALLOWLIST_IPS = "";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars" })
      },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).generation.name).toBe("Nebula");
  });

  it("allows generate via moderation bearer token", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.EFFECT_MODERATION_TOKEN = "secret-token";
    process.env.EFFECT_GENERATE_ALLOWLIST_IPS = "";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { authorization: "Bearer secret-token" },
        body: JSON.stringify({ prompt: "make stars" })
      },
      res.response
    );

    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).generation.name).toBe("Nebula");
  });

  it("rate limits generate requests by identity", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.EFFECT_GENERATE_RATE_LIMIT_MAX = "1";
    process.env.EFFECT_GENERATE_RATE_LIMIT_WINDOW_MS = "300000";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");

    const first = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars" })
      },
      first.response
    );
    expect(first.response.statusCode).toBe(200);

    const second = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "make stars again" })
      },
      second.response
    );
    expect(second.response.statusCode).toBe(429);
    expect(JSON.parse(second.getBody()).error).toContain("wait 5 minutes");
  });

  it("enforces explicit generate prompt length limits", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();

    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "x".repeat(3001) })
      },
      res.response
    );

    expect(res.response.statusCode).toBe(400);
    expect(JSON.parse(res.getBody()).error).toContain("3000");
  });

  it("enforces a global daily generation cap", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.EFFECT_GENERATE_DAILY_CAP = "1";
    process.env.EFFECT_GENERATE_RATE_LIMIT_MAX = "10";
    process.env.EFFECT_GENERATE_RATE_LIMIT_WINDOW_MS = "60000";
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");

    const first = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "127.0.0.1" },
        body: JSON.stringify({ prompt: "first request" })
      },
      first.response
    );
    expect(first.response.statusCode).toBe(200);

    const second = createResponse();
    await handler(
      {
        method: "POST",
        url: "/api/effects?action=generate",
        headers: { "x-forwarded-for": "198.51.100.10" },
        body: JSON.stringify({ prompt: "second request" })
      },
      second.response
    );
    expect(second.response.statusCode).toBe(429);
    expect(JSON.parse(second.getBody()).error).toContain("Daily generation limit reached (1/day)");
  });
});
