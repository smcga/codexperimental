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

function createMockRedis(initialApproved: unknown[] = [], initialPending: unknown[] = []): MockRedis {
  const approved = [...initialApproved];
  let pending = [...initialPending];

  return {
    get: vi.fn(async (key: string) => (key === "doodles:pending" ? pending : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      if (key === "doodles:pending") {
        pending = Array.isArray(value) ? [...value] : [];
      }
      return "OK";
    }),
    lrange: vi.fn(async (key: string) => (key === "doodles:items" ? approved : [])),
    lpush: vi.fn(async (key: string, value: unknown) => {
      if (key === "doodles:items") {
        approved.unshift(value);
        return approved.length;
      }
      return 0;
    }),
    ltrim: vi.fn(async (_key: string, _start: number, stop: number) => {
      approved.splice(stop + 1);
      return "OK";
    })
  };
}

describe("api/doodles handler", () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200 })) as typeof fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns an empty approved doodle list when KV is not configured", async () => {
    delete process.env.DB2_KV_REST_API_URL;
    delete process.env.DB2_KV_URL;
    delete process.env.DB2_REDIS_URL;
    delete process.env.DB2_KV_REST_API_TOKEN;
    delete process.env.DB2_KV_REST_API_READ_ONLY_TOKEN;
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

  it("keeps new submissions pending until approved", async () => {
    delete process.env.DOODLE_MODERATION_TOKEN;
    delete process.env.DOODLE_ADMIN_TOKEN;
    delete process.env.DOODLE_MODERATION_BASE_URL;
    delete process.env.SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;

    const existingApproved = {
      id: "approved-1",
      imageData: "data:image/png;base64,YQ==",
      createdAt: 100
    };
    const redis = createMockRedis([existingApproved]);

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");

    const postRes = createResponse();
    await handler(
      {
        method: "POST",
        body: JSON.stringify({ imageData: "data:image/png;base64,c3VibWl0dGVk" }),
        url: "/api/doodles"
      },
      postRes.response
    );

    expect(postRes.response.statusCode).toBe(200);
    const payload = JSON.parse(postRes.getBody());
    expect(payload).toEqual(
      expect.objectContaining({
        doodle: expect.objectContaining({ imageData: "data:image/png;base64,c3VibWl0dGVk" }),
        moderationStatus: "pending"
      })
    );
    expect(payload.reviewUrl === null || typeof payload.reviewUrl === "string").toBe(true);
    expect(redis.lpush).not.toHaveBeenCalled();

    const getRes = createResponse();
    await handler({ method: "GET", url: "/api/doodles" }, getRes.response);
    expect(getRes.getBody()).toBe(JSON.stringify({ doodles: [existingApproved] }));
  });

  it("returns pending doodles for authorized moderation requests", async () => {
    process.env.DOODLE_MODERATION_TOKEN = "secret-token";
    const approved = [{ id: "approved", imageData: "data:image/png;base64,YQ==", createdAt: 1 }];
    const pending = [{ id: "pending", imageData: "data:image/png;base64,Yg==", createdAt: 2 }];
    const redis = createMockRedis(approved, pending);

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");

    const unauthorizedRes = createResponse();
    await handler({ method: "GET", url: "/api/doodles?includePending=1" }, unauthorizedRes.response);
    expect(unauthorizedRes.response.statusCode).toBe(401);

    const authorizedRes = createResponse();
    await handler(
      { method: "GET", url: "/api/doodles?includePending=1&token=secret-token" },
      authorizedRes.response
    );
    expect(authorizedRes.response.statusCode).toBe(200);
    expect(JSON.parse(authorizedRes.getBody())).toEqual({ doodles: approved, pendingDoodles: pending });
  });

  it("returns a single pending doodle for the review page", async () => {
    process.env.DOODLE_MODERATION_TOKEN = "secret-token";
    process.env.DOODLE_MODERATION_BASE_URL = "https://demo.example.com";
    const pending = [{ id: "pending-1", imageData: "data:image/png;base64,Yg==", createdAt: 2 }];
    const redis = createMockRedis([], pending);

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");
    const response = createResponse();

    await handler(
      { method: "GET", url: "/api/doodles?pendingId=pending-1&token=secret-token" },
      response.response
    );

    expect(response.response.statusCode).toBe(200);
    expect(JSON.parse(response.getBody())).toEqual({
      doodle: pending[0],
      reviewUrl: "https://demo.example.com/review.html?id=pending-1&token=secret-token"
    });
  });

  it("approves a pending doodle through a signed one-tap link", async () => {
    process.env.DOODLE_MODERATION_TOKEN = "secret-token";
    const pending = [{ id: "pending-1", imageData: "data:image/png;base64,Yg==", createdAt: 2 }];
    const redis = createMockRedis([], pending);

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");
    const approveRes = createResponse();

    await handler(
      {
        method: "GET",
        url: "/api/doodles?action=approve&id=pending-1&token=secret-token"
      },
      approveRes.response
    );

    expect(approveRes.response.statusCode).toBe(200);
    expect(approveRes.getHeader("Content-Type")).toContain("text/html");
    expect(redis.lpush).toHaveBeenCalledWith("doodles:items", pending[0]);
    expect(redis.set).toHaveBeenCalledWith("doodles:pending", []);
  });

  it("sends a moderation notification with review metadata when configured", async () => {
    process.env.DOODLE_MODERATION_TOKEN = "secret-token";
    process.env.DOODLE_MODERATION_BASE_URL = "https://demo.example.com";
    process.env.DOODLE_MODERATION_WEBHOOK_URL = "https://hooks.example.com/doodles";
    const redis = createMockRedis();

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");
    const response = createResponse();

    await handler(
      {
        method: "POST",
        body: JSON.stringify({ imageData: "data:image/png;base64,c3VibWl0dGVk" }),
        url: "/api/doodles"
      },
      response.response
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://hooks.example.com/doodles",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("https://demo.example.com/review.html?id=")
      })
    );
  });

  it("sends an ntfy message that opens the review page on tap", async () => {
    process.env.DOODLE_MODERATION_TOKEN = "secret-token";
    process.env.DOODLE_MODERATION_BASE_URL = "https://demo.example.com";
    process.env.DOODLE_MODERATION_NTFY_URL = "https://ntfy.sh/doodle-topic";
    process.env.DOODLE_MODERATION_NTFY_TOKEN = "ntfy-token";
    const redis = createMockRedis();

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");
    const response = createResponse();

    await handler(
      {
        method: "POST",
        body: JSON.stringify({ imageData: "data:image/png;base64,c3VibWl0dGVk" }),
        url: "/api/doodles"
      },
      response.response
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://ntfy.sh/doodle-topic",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "text/plain; charset=utf-8",
          Title: "Doodle awaiting approval",
          Priority: "high",
          Click: expect.stringMatching(/^https:\/\/demo\.example\.com\/review\.html\?id=/),
          Authorization: "Bearer ntfy-token"
        }),
        body: expect.stringContaining("Tap this notification to open the doodle review page")
      })
    );
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "https://ntfy.sh/doodle-topic",
      expect.objectContaining({
        body: expect.stringContaining("Approve: https://demo.example.com/api/doodles?action=approve")
      })
    );
  });

  it("rejects invalid doodle payloads", async () => {
    const redis = createMockRedis();

    vi.doMock("./kv.js", () => ({
      createKvClients: () => ({ readClient: redis, writeClient: redis })
    }));

    const { default: handler } = await import("./doodles");
    const { response, getBody } = createResponse();

    await handler({ method: "POST", body: JSON.stringify({ imageData: "nope" }) }, response);

    expect(response.statusCode).toBe(400);
    expect(getBody()).toBe(JSON.stringify({ error: "A PNG doodle is required." }));
    expect(redis.set).not.toHaveBeenCalled();
    expect(redis.lpush).not.toHaveBeenCalled();
  });
});
