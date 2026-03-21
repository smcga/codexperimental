import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockRedis = {
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

describe("api/doodles handler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns an empty doodle list when KV is not configured", async () => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_URL;
    delete process.env.REDIS_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;

    const { default: handler } = await import("./doodles");
    const { response, getBody } = createResponse();

    await handler({ method: "GET" }, response);

    expect(response.statusCode).toBe(200);
    expect(getBody()).toBe(JSON.stringify({ doodles: [] }));
  });

  it("uses the read client for GET and write client for POST", async () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "write-token";
    process.env.KV_REST_API_READ_ONLY_TOKEN = "read-token";

    const existingDoodle = {
      id: "old",
      imageData: "data:image/png;base64,b2xk",
      createdAt: 100
    };
    const nextDoodles = [
      {
        id: "new",
        imageData: "data:image/png;base64,bmV3",
        createdAt: 200
      },
      existingDoodle
    ];

    const readMock: MockRedis = {
      lrange: vi.fn(async () => [existingDoodle]),
      lpush: vi.fn(async () => 0),
      ltrim: vi.fn(async () => "OK")
    };
    const writeMock: MockRedis = {
      lrange: vi.fn(async () => nextDoodles),
      lpush: vi.fn(async () => 2),
      ltrim: vi.fn(async () => "OK")
    };

    vi.mock("@upstash/redis", () => ({
      Redis: vi.fn()
        .mockImplementationOnce(() => readMock)
        .mockImplementationOnce(() => writeMock)
    }));

    const { default: handler } = await import("./doodles");

    const getRes = createResponse();
    await handler({ method: "GET" }, getRes.response);
    expect(getRes.response.statusCode).toBe(200);
    expect(getRes.getBody()).toBe(JSON.stringify({ doodles: [existingDoodle] }));

    const postRes = createResponse();
    await handler(
      {
        method: "POST",
        body: JSON.stringify({ imageData: "data:image/png;base64,c3VibWl0dGVk" })
      },
      postRes.response
    );
    expect(postRes.response.statusCode).toBe(200);
    expect(JSON.parse(postRes.getBody())).toEqual({ doodles: nextDoodles });
    expect(writeMock.lpush).toHaveBeenCalledWith(
      "doodles:items",
      expect.objectContaining({ imageData: "data:image/png;base64,c3VibWl0dGVk" })
    );
  });

  it("rejects invalid doodle payloads", async () => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "write-token";

    const mock: MockRedis = {
      lrange: vi.fn(async () => []),
      lpush: vi.fn(async () => 1),
      ltrim: vi.fn(async () => "OK")
    };

    vi.mock("@upstash/redis", () => ({
      Redis: vi.fn().mockImplementation(() => mock)
    }));

    const { default: handler } = await import("./doodles");
    const { response, getBody } = createResponse();

    await handler({ method: "POST", body: JSON.stringify({ imageData: "nope" }) }, response);

    expect(response.statusCode).toBe(400);
    expect(getBody()).toBe(JSON.stringify({ error: "A PNG doodle is required." }));
    expect(mock.lpush).not.toHaveBeenCalled();
  });
});
