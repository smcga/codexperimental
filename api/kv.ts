import { Redis } from "@upstash/redis";

type KvEnv = NodeJS.ProcessEnv;

export type KvClient = Pick<Redis, "get" | "incr" | "lrange" | "lpush" | "ltrim">;

type KvConfig = {
  url: string | null;
  readToken: string | null;
  writeToken: string | null;
};

function normalizeEnvValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted = trimmed.replace(/^("|')(.*)\1$/s, "$2").trim();
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

function hasAnyDefined(env: KvEnv, keys: string[]): boolean {
  return keys.some((key) => normalizeEnvValue(env[key]) !== null);
}

function getHttpCompatibleUrl(env: KvEnv, keys: string[]): string | null {
  const url = getFirstDefined(env, keys);
  if (url?.startsWith("http://") || url?.startsWith("https://")) {
    return url;
  }

  return null;
}

export function getKvConfig(env: KvEnv = process.env): KvConfig {
  const hasDb2Config = hasAnyDefined(env, [
    "DB2_KV_REST_API_URL",
    "DB2_KV_URL",
    "DB2_REDIS_URL",
    "DB2_KV_REST_API_TOKEN",
    "DB2_KV_REST_API_READ_ONLY_TOKEN"
  ]);

  const url = hasDb2Config
    ? getHttpCompatibleUrl(env, ["DB2_KV_REST_API_URL", "DB2_KV_URL", "DB2_REDIS_URL"])
    : getHttpCompatibleUrl(env, ["KV_REST_API_URL", "KV_URL", "REDIS_URL"]);

  const writeToken = hasDb2Config
    ? getFirstDefined(env, ["DB2_KV_REST_API_TOKEN"])
    : getFirstDefined(env, ["KV_REST_API_TOKEN"]);

  const readToken = hasDb2Config
    ? getFirstDefined(env, ["DB2_KV_REST_API_READ_ONLY_TOKEN"])
    : getFirstDefined(env, ["KV_REST_API_READ_ONLY_TOKEN"]);

  return {
    url,
    readToken: readToken ?? writeToken,
    writeToken
  };
}

export function createKvClients(env: KvEnv = process.env): { readClient: KvClient | null; writeClient: KvClient | null } {
  const { url, readToken, writeToken } = getKvConfig(env);

  const readClient = url && readToken ? new Redis({ url, token: readToken }) : null;
  const writeClient = url && writeToken ? new Redis({ url, token: writeToken }) : null;

  return { readClient, writeClient };
}
