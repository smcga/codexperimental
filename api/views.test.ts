import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRedis = {
  get: (key: string) => Promise<number | null>;
  incr: (key: string) => Promise<number>;
};

const createResponse = () => {
  const headers = new Map<string, string>();
  let body = "";
  return {
    response: {
      statusCode: 0,
      setHeader: (key: string, value: string) => {
        headers.set(key, value);
      },
      end: (value = "") => {
        body = value;
      }
    },
    getBody: () => body,
    getHeader: (key: string) => headers.get(key)
  };
};

describe("api/views handler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns 0 when no env vars are configured", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_URL;
    delete process.env.REDIS_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;

    const { default: handler } = await import("./views");
    const { response, getBody } = createResponse();

    await handler({ method: "GET" }, response);

    expect(response.statusCode).toBe(200);
    expect(getBody()).toBe(JSON.stringify({ count: 0 }));
  });

  it("uses the read client for GET and write client for POST", async () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "write-token";
    process.env.KV_REST_API_READ_ONLY_TOKEN = "read-token";

    const readMock: MockRedis = {
      get: vi.fn(async () => 3),
      incr: vi.fn(async () => 0)
    };
    const writeMock: MockRedis = {
      get: vi.fn(async () => 0),
      incr: vi.fn(async () => 4)
    };

    vi.mock("@upstash/redis", () => ({
      Redis: vi.fn()
        .mockImplementationOnce(() => readMock)
        .mockImplementationOnce(() => writeMock)
    }));

    const { default: handler } = await import("./views");

    const getRes = createResponse();
    await handler({ method: "GET" }, getRes.response);
    expect(getRes.response.statusCode).toBe(200);
    expect(getRes.getBody()).toBe(JSON.stringify({ count: 3 }));

    const postRes = createResponse();
    await handler({ method: "POST" }, postRes.response);
    expect(postRes.response.statusCode).toBe(200);
    expect(postRes.getBody()).toBe(JSON.stringify({ count: 4 }));
  });
});
