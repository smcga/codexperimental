import { describe, expect, it } from "vitest";

import { getKvConfig } from "./kv";

describe("getKvConfig", () => {
  it("prefers DB2-prefixed env vars when present", () => {
    const config = getKvConfig({
      DB2_KV_REST_API_URL: "https://db2.example.upstash.io",
      DB2_KV_REST_API_TOKEN: "db2-write",
      DB2_KV_REST_API_READ_ONLY_TOKEN: "db2-read",
      KV_REST_API_URL: "https://legacy.example.upstash.io",
      KV_REST_API_TOKEN: "legacy-write",
      KV_REST_API_READ_ONLY_TOKEN: "legacy-read"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://db2.example.upstash.io",
      writeToken: "db2-write",
      readToken: "db2-read"
    });
  });

  it("falls back to legacy env vars when DB2-prefixed vars are absent", () => {
    const config = getKvConfig({
      KV_REST_API_URL: "https://legacy.example.upstash.io",
      KV_REST_API_TOKEN: "legacy-write",
      KV_REST_API_READ_ONLY_TOKEN: "legacy-read"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://legacy.example.upstash.io",
      writeToken: "legacy-write",
      readToken: "legacy-read"
    });
  });

  it("uses the write token for reads when no read-only token is configured", () => {
    const config = getKvConfig({
      DB2_KV_REST_API_URL: "https://db2.example.upstash.io",
      DB2_KV_REST_API_TOKEN: "db2-write"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://db2.example.upstash.io",
      writeToken: "db2-write",
      readToken: "db2-write"
    });
  });
});
