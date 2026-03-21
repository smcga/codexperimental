import { describe, expect, it, vi } from "vitest";

import { createKvClients, getKvConfig } from "./kv";

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

  it("locks to DB2 vars once any DB2 config is present", () => {
    const config = getKvConfig({
      DB2_KV_REST_API_URL: "https://db2.example.upstash.io",
      DB2_KV_REST_API_TOKEN: "db2-write",
      KV_REST_API_URL: "https://legacy.example.upstash.io",
      KV_REST_API_TOKEN: "legacy-write",
      KV_REST_API_READ_ONLY_TOKEN: "legacy-read"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://db2.example.upstash.io",
      writeToken: "db2-write",
      readToken: "db2-write"
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

  it("normalizes quoted env values so copied dashboard values still work", () => {
    const config = getKvConfig({
      DB2_KV_REST_API_URL: '  "https://db2.example.upstash.io"\n',
      DB2_KV_REST_API_TOKEN: ' "db2-write" ',
      DB2_KV_REST_API_READ_ONLY_TOKEN: "\n'db2-read'\n"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://db2.example.upstash.io",
      writeToken: "db2-write",
      readToken: "db2-read"
    });
  });

  it("ignores redis protocol URLs that are not usable with the REST SDK", () => {
    const config = getKvConfig({
      DB2_KV_URL: "redis://default:password@db2.example.upstash.io:6379",
      DB2_REDIS_URL: "redis://default:password@db2.example.upstash.io:6379",
      DB2_KV_REST_API_TOKEN: "db2-write"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: null,
      writeToken: "db2-write",
      readToken: "db2-write"
    });
  });

  it("still accepts HTTP-compatible fallback URLs", () => {
    const config = getKvConfig({
      DB2_KV_URL: "https://db2.example.upstash.io",
      DB2_KV_REST_API_TOKEN: "db2-write"
    } as NodeJS.ProcessEnv);

    expect(config).toEqual({
      url: "https://db2.example.upstash.io",
      writeToken: "db2-write",
      readToken: "db2-write"
    });
  });

  it("returns null clients instead of throwing when Redis construction fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const clients = createKvClients({
      DB2_KV_REST_API_URL: "https://",
      DB2_KV_REST_API_TOKEN: "db2-write"
    } as NodeJS.ProcessEnv);

    expect(clients).toEqual({
      readClient: null,
      writeClient: null
    });
    expect(consoleError).toHaveBeenCalled();
  });

});
