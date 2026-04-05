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
      json: async () => ({ output_text: '{"name":"Nebula","typescriptCode":"ts","runtimeCode":"return { render() {} };"}' })
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

  it("stores submissions as pending", async () => {
    const redis = createMockRedis();
    vi.doMock("./kv.js", () => ({ createKvClients: () => ({ readClient: redis, writeClient: redis }) }));
    const { default: handler } = await import("./effects");
    const res = createResponse();
    await handler({ method: "POST", url: "/api/effects", body: JSON.stringify({ name: "A", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };" }) }, res.response);
    expect(res.response.statusCode).toBe(200);
    expect(JSON.parse(res.getBody()).moderationStatus).toBe("pending");
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
});
