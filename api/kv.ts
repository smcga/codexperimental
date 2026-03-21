import { Redis } from "@upstash/redis";

type KvEnv = NodeJS.ProcessEnv;

export type KvClient = Pick<Redis, "get" | "incr" | "lrange" | "lpush" | "ltrim">;

function normalizeEnvValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted = trimmed.replace(/^(["'])(.*)\1$/s, "$2").trim();
  return unquoted || null;
}

function getFirstDefined(env: KvEnv, keys: string[]): string | null {
  for (const key of keys) {
    const value = normalizeEnvValue(env[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function getRestUrl(env: KvEnv): string | null {
  const preferredRestUrl = getFirstDefined(env, ["DB2_KV_REST_API_URL", "KV_REST_API_URL"]);
  if (preferredRestUrl) {
    return preferredRestUrl;
  }

  const compatibleUrl = getFirstDefined(env, ["DB2_KV_URL", "DB2_REDIS_URL", "KV_URL", "REDIS_URL"]);
  if (compatibleUrl?.startsWith("http://") || compatibleUrl?.startsWith("https://")) {
    return compatibleUrl;
  }

  return null;
}

export function getKvConfig(env: KvEnv = process.env): { url: string | null; readToken: string | null; writeToken: string | null } {
  const url = getRestUrl(env);
  const writeToken = getFirstDefined(env, ["DB2_KV_REST_API_TOKEN", "KV_REST_API_TOKEN"]);
  const readToken = getFirstDefined(env, ["DB2_KV_REST_API_READ_ONLY_TOKEN", "KV_REST_API_READ_ONLY_TOKEN"]) ?? writeToken;

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
