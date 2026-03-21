import { Redis } from "@upstash/redis";

type KvEnv = NodeJS.ProcessEnv;

export type KvClient = Pick<Redis, "get" | "incr" | "lrange" | "lpush" | "ltrim">;

export function getKvConfig(env: KvEnv = process.env): { url: string | null; readToken: string | null; writeToken: string | null } {
  const url = env.DB2_KV_REST_API_URL ?? env.DB2_KV_URL ?? env.DB2_REDIS_URL ?? env.KV_REST_API_URL ?? env.KV_URL ?? env.REDIS_URL ?? null;
  const writeToken = env.DB2_KV_REST_API_TOKEN ?? env.KV_REST_API_TOKEN ?? null;
  const readToken = env.DB2_KV_REST_API_READ_ONLY_TOKEN ?? env.KV_REST_API_READ_ONLY_TOKEN ?? writeToken;

  return {
    url,
    readToken,
    writeToken
  };
}

export function createKvClients(env: KvEnv = process.env): { readClient: KvClient | null; writeClient: KvClient | null } {
  const { url, readToken, writeToken } = getKvConfig(env);

  const readClient = url && readToken ? new Redis({ url, token: readToken }) : null;
  const writeClient = url && writeToken ? new Redis({ url, token: writeToken }) : null;

  return { readClient, writeClient };
}
