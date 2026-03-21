import { afterEach, describe, expect, it } from "vitest";

import { createKvClients, getKvConfig } from "./kv.js";

const originalEnv = { ...process.env };
const hasDb2IntegrationEnv = Boolean(process.env.DB2_KV_REST_API_URL && process.env.DB2_KV_REST_API_TOKEN);

afterEach(() => {
  process.env = { ...originalEnv };
});

describe.skipIf(!hasDb2IntegrationEnv)("api/kv integration", () => {
  it("connects to the configured DB2 Upstash database", async () => {
    process.env = { ...originalEnv };

    const config = getKvConfig(process.env);
    expect(config.url).toBeTruthy();
    expect(config.writeToken).toBeTruthy();

    const { readClient, writeClient } = createKvClients(process.env);
    expect(readClient).not.toBeNull();
    expect(writeClient).not.toBeNull();

    const integrationKey = `integration:kv:${Date.now()}`;
    const writeCount = await writeClient!.incr(integrationKey);
    const readCount = await readClient!.get<number>(integrationKey);

    expect(writeCount).toBeGreaterThanOrEqual(1);
    expect(readCount).toBe(writeCount);
  }, 20_000);
});
