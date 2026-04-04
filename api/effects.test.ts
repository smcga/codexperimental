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
  return {
    get: vi.fn(async (key: string) => (key === "effects:pending" ? pending : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      if (key === "effects:pending") {
        pending = Array.isArray(value) ? [...value] : [];
      }
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
    await handler({ method: "POST", url: "/api/effects?action=generate", body: JSON.stringify({ prompt: "make stars" }) }, res.response);
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
    await handler({ method: "POST", url: "/api/effects?action=generate", body: JSON.stringify({ prompt: "make stars" }) }, res.response);
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
    await handler({ method: "POST", url: "/api/effects?action=generate", body: JSON.stringify({ prompt: "make stars" }) }, res.response);
    expect(res.response.statusCode).toBe(503);
    const payload = JSON.parse(res.getBody());
    expect(payload.error).toContain("Unable to parse generated effect response.");
    expect(payload.rawResponse).toContain("I can help with that");
  });
});
