import { createKvClients } from "./kv.js";

const { readClient, writeClient } = createKvClients();

const EFFECTS_KEY = "effects:items";
const PENDING_EFFECTS_KEY = "effects:pending";
const GENERATE_RATE_LIMIT_PREFIX = "effects:generate:rl";
const GENERATE_METRICS_KEY = "effects:generate:metrics";
const GENERATE_ERROR_SAMPLES_KEY = "effects:generate:error-samples";
const GENERATE_ALERT_COOLDOWN_PREFIX = "effects:generate:alert-cooldown";
const PARAM_LIMITS_KEY = "effects:param-limits";
const MAX_EFFECTS = 128;
const MAX_PENDING_EFFECTS = 128;
const MAX_GENERATE_ERROR_SAMPLES = 200;
const MAX_GENERATE_PROMPT_LENGTH = 3000;
const DEFAULT_GENERATE_RATE_LIMIT_MAX = 8;
const DEFAULT_GENERATE_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_GENERATE_DAILY_CAP = 100;
const MODERATION_TOKEN_ENV_KEYS = ["EFFECT_MODERATION_TOKEN", "DOODLE_MODERATION_TOKEN", "DOODLE_ADMIN_TOKEN"];
const MODERATION_BASE_URL_ENV_KEYS = [
  "EFFECT_MODERATION_BASE_URL",
  "DOODLE_MODERATION_BASE_URL",
  "SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL"
];

type RequestLike = {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  on?: (event: string, handler: (chunk: string) => void) => void;
};

type ResponseLike = {
  statusCode: number;
  setHeader: (key: string, value: string) => void;
  end: (body?: string) => void;
};

type EffectRecord = {
  id: string;
  name: string;
  prompt: string;
  typescriptCode: string;
  runtimeCode: string;
  params?: GeneratedEffectParam[];
  docs?: GeneratedEffectDocs;
  createdAt: number;
};

/**
 * Security invariant: model-generated effect code is treated as untrusted text on the server.
 *
 * The API may validate shape/limits and persist the payload for moderation, but it must never
 * evaluate, import, or otherwise execute submitted `typescriptCode`/`runtimeCode`.
 * Execution is intentionally limited to browser-side preview/runtime paths.
 */

type GeneratedEffectParamOption = {
  label: string;
  value: string;
};

type GeneratedEffectParam = {
  key: string;
  label: string;
  type: "number" | "select" | "toggle";
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: GeneratedEffectParamOption[];
  description?: string;
};

type GeneratedEffectDocs = {
  description: string;
  parameters: string;
};

type JsonBody = Record<string, unknown>;

type JsonResponse = {
  effects?: EffectRecord[];
  effect?: EffectRecord;
  pendingEffects?: EffectRecord[];
  moderationStatus?: "pending" | "approved" | "rejected";
  reviewUrl?: string | null;
  generation?: {
    name: string;
    typescriptCode: string;
    runtimeCode: string;
    params?: GeneratedEffectParam[];
    docs?: GeneratedEffectDocs;
  };
  generateMetrics?: GenerateMetrics;
  recentGenerateErrors?: GenerateErrorSample[];
  paramLimits?: EffectParamLimitsRecord;
  error?: string;
  rawResponse?: string;
};

type EffectParamLimitRange = {
  min?: number;
  max?: number;
};

type EffectParamLimitsRecord = Record<string, Record<string, EffectParamLimitRange>>;

type GenerateRateLimitState = {
  hits: number[];
};

type GenerateFailureCategory = "rate_limited" | "validation" | "openai_config" | "model_parse" | "upstream" | "unknown";

type GenerateErrorSample = {
  timestamp: string;
  requestId: string;
  httpStatus: number;
  category: GenerateFailureCategory;
  message: string;
  promptLength: number;
  authMode: string;
};

type GenerateMetrics = {
  totalRequests: number;
  acceptedRequests: number;
  failedRequests: number;
  statusCounts: Record<string, number>;
  failureCategoryCounts: Record<string, number>;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
};

function sendJson(res: ResponseLike, status: number, body: JsonResponse): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function sendHtml(res: ResponseLike, status: number, title: string, message: string): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title><style>body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#05070f;color:#e8f7ff;display:grid;place-items:center;min-height:100vh;padding:24px}.card{max-width:520px;padding:24px;border:1px solid rgba(142,249,255,.25);background:rgba(2,6,10,.95);box-shadow:0 0 32px rgba(0,0,0,.45)}h1{margin:0 0 12px;font-size:1.4rem;letter-spacing:.06em;text-transform:uppercase}p{margin:0;color:rgba(232,247,255,.82);line-height:1.6}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`);
}

async function readBody(req: RequestLike): Promise<JsonBody> {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as JsonBody;
    } catch {
      return {};
    }
  }
  if (req.body instanceof Uint8Array) {
    try {
      return JSON.parse(new TextDecoder().decode(req.body)) as JsonBody;
    } catch {
      return {};
    }
  }
  if (req.body && typeof req.body === "object") {
    return req.body as JsonBody;
  }
  return {};
}

function normalizeEnvValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }
  return typeof value === "string" ? value : null;
}

function getHeader(req: RequestLike, key: string): string | null {
  const direct = getHeaderValue(req.headers?.[key]);
  if (direct) {
    return direct;
  }
  return getHeaderValue(req.headers?.[key.toLowerCase()]);
}

function getRequestUrl(req: RequestLike): URL {
  const rawUrl = req.url ?? "/api/effects";
  const proto = getHeaderValue(req.headers?.["x-forwarded-proto"]) ?? "https";
  const host = getHeaderValue(req.headers?.host) ?? "localhost";
  return new URL(rawUrl, `${proto}://${host}`);
}

function getModerationToken(): string | null {
  for (const key of MODERATION_TOKEN_ENV_KEYS) {
    const value = normalizeEnvValue(process.env[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

function isAuthorized(url: URL): boolean {
  const token = getModerationToken();
  return Boolean(token && url.searchParams.get("token") === token);
}

function parseCookieHeader(cookieHeader: string | null): Map<string, string> {
  if (!cookieHeader) {
    return new Map();
  }
  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter((entry) => entry.includes("="))
      .map((entry) => {
        const [name, ...valueParts] = entry.split("=");
        return [name.trim(), valueParts.join("=").trim()];
      })
  );
}

function getClientIp(req: RequestLike): string {
  const forwardedFor = getHeader(req, "x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }
  return getHeader(req, "x-real-ip") ?? "unknown";
}

function getSessionIdentity(req: RequestLike): string | null {
  const assertedIdentity = getHeader(req, "x-user-id") ?? getHeader(req, "x-auth-request-user");
  if (assertedIdentity && assertedIdentity.trim().length > 0) {
    return assertedIdentity.trim().slice(0, 128);
  }
  const cookieNames = (
    normalizeEnvValue(process.env.EFFECT_GENERATE_SESSION_COOKIE_NAMES)
    ?? "__session,next-auth.session-token,__Secure-next-auth.session-token"
  )
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  const cookieMap = parseCookieHeader(getHeader(req, "cookie"));
  for (const cookieName of cookieNames) {
    const value = cookieMap.get(cookieName);
    if (typeof value === "string" && value.trim().length > 0) {
      return `cookie:${cookieName}`;
    }
  }
  return null;
}

function hasSignedAdminToken(req: RequestLike, url: URL): boolean {
  const token = getModerationToken();
  if (!token) {
    return false;
  }
  if (url.searchParams.get("token") === token) {
    return true;
  }
  if (getHeader(req, "x-moderation-token") === token) {
    return true;
  }
  const auth = getHeader(req, "authorization");
  if (auth?.startsWith("Bearer ") && auth.slice("Bearer ".length).trim() === token) {
    return true;
  }
  return false;
}

function parseAllowlist(value: string | null): Set<string> {
  if (!value) {
    return new Set();
  }
  return new Set(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  );
}

function getGenerateAccess(req: RequestLike, url: URL): { reason: "admin_token" | "session_auth" | "allowlist" | "public"; identity: string } {
  if (hasSignedAdminToken(req, url)) {
    return { reason: "admin_token", identity: "admin-token" };
  }
  const sessionIdentity = getSessionIdentity(req);
  if (sessionIdentity) {
    return { reason: "session_auth", identity: sessionIdentity };
  }
  const ip = getClientIp(req);
  const ipAllowlist = parseAllowlist(normalizeEnvValue(process.env.EFFECT_GENERATE_ALLOWLIST_IPS));
  if (ipAllowlist.has(ip)) {
    return { reason: "allowlist", identity: `ip:${ip}` };
  }
  const userAllowlist = parseAllowlist(normalizeEnvValue(process.env.EFFECT_GENERATE_ALLOWLIST_USERS));
  const assertedUser = getHeader(req, "x-user-id");
  if (assertedUser && userAllowlist.has(assertedUser.trim())) {
    return { reason: "allowlist", identity: `user:${assertedUser.trim().slice(0, 128)}` };
  }
  return { reason: "public", identity: ip === "unknown" ? "anonymous" : `ip:${ip}` };
}

function getRateLimitConfig(): { max: number; windowMs: number } {
  const max = Number.parseInt(normalizeEnvValue(process.env.EFFECT_GENERATE_RATE_LIMIT_MAX) ?? `${DEFAULT_GENERATE_RATE_LIMIT_MAX}`, 10);
  const windowMs = Number.parseInt(
    normalizeEnvValue(process.env.EFFECT_GENERATE_RATE_LIMIT_WINDOW_MS) ?? `${DEFAULT_GENERATE_RATE_LIMIT_WINDOW_MS}`,
    10
  );
  return {
    max: Number.isFinite(max) && max > 0 ? max : DEFAULT_GENERATE_RATE_LIMIT_MAX,
    windowMs: Number.isFinite(windowMs) && windowMs > 0 ? windowMs : DEFAULT_GENERATE_RATE_LIMIT_WINDOW_MS
  };
}

async function consumeGenerateRateLimit(key: string, now = Date.now()): Promise<{ allowed: boolean; retryAfterSec: number; remaining: number }> {
  if (!writeClient) {
    return { allowed: true, retryAfterSec: 0, remaining: getRateLimitConfig().max };
  }
  const { max, windowMs } = getRateLimitConfig();
  const redisKey = `${GENERATE_RATE_LIMIT_PREFIX}:${key}`;
  let state: GenerateRateLimitState = { hits: [] };
  try {
    const raw = await writeClient.get(redisKey);
    if (raw && typeof raw === "object" && Array.isArray((raw as GenerateRateLimitState).hits)) {
      state = {
        hits: (raw as GenerateRateLimitState).hits.filter((hit) => typeof hit === "number" && Number.isFinite(hit))
      };
    }
  } catch {
    return { allowed: true, retryAfterSec: 0, remaining: max };
  }
  const cutoff = now - windowMs;
  const recentHits = state.hits.filter((hit) => hit > cutoff);
  if (recentHits.length >= max) {
    const oldest = recentHits[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec, remaining: 0 };
  }
  recentHits.push(now);
  try {
    await writeClient.set(redisKey, { hits: recentHits });
  } catch {
    return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, max - recentHits.length) };
  }
  return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, max - recentHits.length) };
}

function getGenerateDailyCap(): number {
  const parsed = Number.parseInt(normalizeEnvValue(process.env.EFFECT_GENERATE_DAILY_CAP) ?? `${DEFAULT_GENERATE_DAILY_CAP}`, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_GENERATE_DAILY_CAP;
  }
  return parsed;
}

function getGenerateAlertCooldownMs(): number {
  const raw = normalizeEnvValue(process.env.EFFECT_GENERATE_ALERT_COOLDOWN_MS);
  if (!raw) {
    return 5 * 60_000;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 5 * 60_000;
  }
  return parsed;
}

function getUtcDayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function getSecondsUntilUtcMidnight(now: number): number {
  const date = new Date(now);
  const nextMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0);
  return Math.max(1, Math.ceil((nextMidnight - now) / 1000));
}

async function consumeGlobalGenerateCap(now = Date.now()): Promise<{ allowed: boolean; retryAfterSec: number; remaining: number; limit: number }> {
  const limit = getGenerateDailyCap();
  if (!writeClient) {
    return { allowed: true, retryAfterSec: 0, remaining: limit, limit };
  }
  const day = getUtcDayKey(now);
  const key = `${GENERATE_RATE_LIMIT_PREFIX}:global:${day}`;
  let count = 0;
  try {
    const raw = await writeClient.get(key);
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
      count = Math.floor(raw);
    } else if (typeof raw === "string") {
      const parsed = Number.parseInt(raw, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        count = parsed;
      }
    } else if (raw && typeof raw === "object" && "count" in raw && typeof (raw as { count?: unknown }).count === "number") {
      const candidate = (raw as { count: number }).count;
      if (Number.isFinite(candidate) && candidate >= 0) {
        count = Math.floor(candidate);
      }
    }
  } catch {
    return { allowed: true, retryAfterSec: 0, remaining: limit, limit };
  }

  if (count >= limit) {
    return {
      allowed: false,
      retryAfterSec: getSecondsUntilUtcMidnight(now),
      remaining: 0,
      limit
    };
  }

  const next = count + 1;
  try {
    await writeClient.set(key, next);
  } catch {
    return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, limit - next), limit };
  }
  return { allowed: true, retryAfterSec: 0, remaining: Math.max(0, limit - next), limit };
}

function logGenerateRequest(details: {
  outcome: "accepted" | "rejected" | "rate_limited" | "error";
  httpStatus: number;
  authMode: string;
  identity: string;
  promptLength: number;
  requestId: string;
  error?: string;
}): void {
  console.info(JSON.stringify({
    event: "effect_generate_request",
    ...details,
    timestamp: new Date().toISOString()
  }));
}

function getDefaultGenerateMetrics(): GenerateMetrics {
  return {
    totalRequests: 0,
    acceptedRequests: 0,
    failedRequests: 0,
    statusCounts: {},
    failureCategoryCounts: {},
    lastSuccessAt: null,
    lastFailureAt: null
  };
}

function toFiniteNonNegativeInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return null;
}

function normalizeCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return Object.entries(value)
    .reduce<Record<string, number>>((acc, [key, raw]) => {
      const normalized = toFiniteNonNegativeInt(raw);
      if (normalized !== null && key.trim().length > 0) {
        acc[key] = normalized;
      }
      return acc;
    }, {});
}

function sanitizeGenerateMetrics(value: unknown): GenerateMetrics {
  if (!value || typeof value !== "object") {
    return getDefaultGenerateMetrics();
  }
  const candidate = value as Partial<GenerateMetrics>;
  return {
    totalRequests: toFiniteNonNegativeInt(candidate.totalRequests) ?? 0,
    acceptedRequests: toFiniteNonNegativeInt(candidate.acceptedRequests) ?? 0,
    failedRequests: toFiniteNonNegativeInt(candidate.failedRequests) ?? 0,
    statusCounts: normalizeCounts(candidate.statusCounts),
    failureCategoryCounts: normalizeCounts(candidate.failureCategoryCounts),
    lastSuccessAt: typeof candidate.lastSuccessAt === "string" ? candidate.lastSuccessAt : null,
    lastFailureAt: typeof candidate.lastFailureAt === "string" ? candidate.lastFailureAt : null
  };
}

function sanitizeGenerateErrorSamples(value: unknown): GenerateErrorSample[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const sample = entry as Partial<GenerateErrorSample>;
    const timestamp = typeof sample.timestamp === "string" ? sample.timestamp : null;
    const requestId = typeof sample.requestId === "string" ? sample.requestId : null;
    const status = toFiniteNonNegativeInt(sample.httpStatus);
    const category = typeof sample.category === "string" ? sample.category : null;
    const message = typeof sample.message === "string" ? sample.message : null;
    const promptLength = toFiniteNonNegativeInt(sample.promptLength);
    const authMode = typeof sample.authMode === "string" ? sample.authMode : null;
    if (!timestamp || !requestId || status === null || !category || !message || promptLength === null || !authMode) {
      return [];
    }
    return [{
      timestamp,
      requestId,
      httpStatus: status,
      category: category as GenerateFailureCategory,
      message,
      promptLength,
      authMode
    }];
  });
}

function categorizeGenerateFailure(outcome: "rejected" | "rate_limited" | "error", httpStatus: number, message: string | undefined): GenerateFailureCategory {
  if (outcome === "rate_limited" || httpStatus === 429) {
    return "rate_limited";
  }
  if (outcome === "rejected" || httpStatus === 400) {
    return "validation";
  }
  const normalizedMessage = (message ?? "").toLowerCase();
  if (normalizedMessage.includes("openai_api_key")) {
    return "openai_config";
  }
  if (normalizedMessage.includes("parse generated effect response")) {
    return "model_parse";
  }
  if (httpStatus >= 500) {
    return "upstream";
  }
  return "unknown";
}

async function recordGenerateMonitoring(details: {
  outcome: "accepted" | "rejected" | "rate_limited" | "error";
  httpStatus: number;
  requestId: string;
  promptLength: number;
  authMode: string;
  requestPath: string;
  error?: string;
}): Promise<void> {
  if (!writeClient) {
    return;
  }
  const nowIso = new Date().toISOString();
  try {
    const existing = await writeClient.get(GENERATE_METRICS_KEY);
    const metrics = sanitizeGenerateMetrics(existing);
    metrics.totalRequests += 1;
    const statusKey = String(details.httpStatus);
    metrics.statusCounts[statusKey] = (metrics.statusCounts[statusKey] ?? 0) + 1;

    if (details.outcome === "accepted") {
      metrics.acceptedRequests += 1;
      metrics.lastSuccessAt = nowIso;
    } else {
      metrics.failedRequests += 1;
      metrics.lastFailureAt = nowIso;
      const category = categorizeGenerateFailure(details.outcome, details.httpStatus, details.error);
      metrics.failureCategoryCounts[category] = (metrics.failureCategoryCounts[category] ?? 0) + 1;

      const existingSamples = await writeClient.get(GENERATE_ERROR_SAMPLES_KEY);
      const samples = sanitizeGenerateErrorSamples(existingSamples);
      const nextSample: GenerateErrorSample = {
        timestamp: nowIso,
        requestId: details.requestId,
        httpStatus: details.httpStatus,
        category,
        message: details.error ?? "Effect generation request failed.",
        promptLength: details.promptLength,
        authMode: details.authMode
      };
      await writeClient.set(GENERATE_ERROR_SAMPLES_KEY, [nextSample, ...samples].slice(0, MAX_GENERATE_ERROR_SAMPLES));
      await sendGenerateAlertIfNeeded(nextSample, metrics, details.requestPath);
    }

    await writeClient.set(GENERATE_METRICS_KEY, metrics);
  } catch {
    // Monitoring should never break effect generation responses.
  }
}

async function sendGenerateAlertIfNeeded(sample: GenerateErrorSample, metrics: GenerateMetrics, requestPath: string): Promise<void> {
  const ntfyUrl = normalizeEnvValue(process.env.EFFECT_GENERATE_ALERT_NTFY_URL)
    ?? normalizeEnvValue(process.env.EFFECT_MODERATION_NTFY_URL)
    ?? normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_URL);
  if (!ntfyUrl || !writeClient) {
    return;
  }

  const cooldownMs = getGenerateAlertCooldownMs();
  const cooldownKey = `${GENERATE_ALERT_COOLDOWN_PREFIX}:${sample.category}`;
  try {
    const existing = await writeClient.get(cooldownKey);
    const lastSentAt = toFiniteNonNegativeInt(existing);
    if (lastSentAt !== null && Date.now() - lastSentAt < cooldownMs) {
      return;
    }
  } catch {
    // Ignore cooldown check failures and continue with alert delivery attempt.
  }

  const ntfyToken = normalizeEnvValue(process.env.EFFECT_GENERATE_ALERT_NTFY_TOKEN)
    ?? normalizeEnvValue(process.env.EFFECT_MODERATION_NTFY_TOKEN)
    ?? normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_TOKEN);

  const lines = [
    `Effect generation failure detected at ${sample.timestamp}.`,
    `Category: ${sample.category}`,
    `Status: ${sample.httpStatus}`,
    `Message: ${sample.message}`,
    `Request ID: ${sample.requestId}`,
    `Path: ${requestPath}`,
    `Prompt length: ${sample.promptLength}`,
    `Auth mode: ${sample.authMode}`,
    `Failed requests (all-time): ${metrics.failedRequests}`,
    `Total generate requests (all-time): ${metrics.totalRequests}`
  ];

  try {
    const response = await fetch(ntfyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Title": `Effect generate alert (${sample.category})`,
        "Priority": "high",
        ...(ntfyToken ? { Authorization: `Bearer ${ntfyToken}` } : {})
      },
      body: lines.join("\n")
    });
    if (!response.ok) {
      return;
    }
    await writeClient.set(cooldownKey, Date.now());
  } catch {
    // Ignore alert send failures; monitoring must remain non-blocking.
  }
}

function formatRetryWait(retryAfterSec: number): string {
  if (retryAfterSec >= 60) {
    const mins = Math.max(1, Math.ceil(retryAfterSec / 60));
    return `${mins} minute${mins === 1 ? "" : "s"}`;
  }
  return `${Math.max(1, retryAfterSec)} second${retryAfterSec === 1 ? "" : "s"}`;
}

function getModerationBaseUrl(requestUrl: URL): string | null {
  for (const key of MODERATION_BASE_URL_ENV_KEYS) {
    const value = normalizeEnvValue(process.env[key]);
    if (!value) {
      continue;
    }
    const candidate = new URL(value.startsWith("http") ? value : `https://${value}`);
    return `${candidate.protocol}//${candidate.host}`;
  }
  return `${requestUrl.protocol}//${requestUrl.host}`;
}

function getReviewUrl(effectId: string, moderationBaseUrl: string | null, moderationToken: string | null): string | null {
  if (!moderationBaseUrl || !moderationToken) {
    return null;
  }
  const url = new URL("/effect-review.html", moderationBaseUrl);
  url.searchParams.set("id", effectId);
  url.searchParams.set("token", moderationToken);
  return url.toString();
}

function isEffectRecord(value: unknown): value is EffectRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const v = value as Partial<EffectRecord>;
  return typeof v.id === "string"
    && typeof v.name === "string"
    && typeof v.prompt === "string"
    && typeof v.typescriptCode === "string"
    && typeof v.runtimeCode === "string"
    && typeof v.createdAt === "number"
    && Number.isFinite(v.createdAt);
}

function coercePendingEffectRecord(value: unknown): EffectRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const entry = value as Record<string, unknown>;
  const id = typeof entry.id === "string" ? entry.id : "";
  const name = typeof entry.name === "string" ? entry.name : "";
  const createdAt = typeof entry.createdAt === "number" ? entry.createdAt : Number.NaN;
  if (!id || !name || !Number.isFinite(createdAt)) {
    return null;
  }

  const prompt = typeof entry.prompt === "string" ? entry.prompt : "";
  const typescriptCode = typeof entry.typescriptCode === "string"
    ? entry.typescriptCode
    : typeof entry.code === "string"
      ? entry.code
      : "";
  const runtimeCode = typeof entry.runtimeCode === "string"
    ? entry.runtimeCode
    : typeof entry.code === "string"
      ? entry.code
      : typescriptCode;
  const docs = sanitizeGeneratedDocs(entry.docs);
  return {
    id,
    name,
    prompt,
    typescriptCode,
    runtimeCode,
    ...(Array.isArray(entry.params) ? { params: sanitizeGeneratedParams(entry.params) } : {}),
    ...(docs ? { docs } : {}),
    createdAt
  };
}

function normalizeEffects(value: unknown): EffectRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => (isEffectRecord(entry) ? [entry] : []));
}

function normalizePendingEffects(value: unknown): EffectRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (isEffectRecord(entry)) {
      return [entry];
    }
    const coerced = coercePendingEffectRecord(entry);
    return coerced ? [coerced] : [];
  });
}

async function readApprovedEffects(): Promise<EffectRecord[]> {
  if (!readClient) {
    return [];
  }
  try {
    return normalizeEffects(await readClient.lrange(EFFECTS_KEY, 0, MAX_EFFECTS - 1));
  } catch {
    return [];
  }
}

async function readPendingEffects(client: { get: (key: string) => Promise<unknown> } | null): Promise<EffectRecord[]> {
  if (!client) {
    return [];
  }
  try {
    return normalizePendingEffects(await client.get(PENDING_EFFECTS_KEY));
  } catch {
    return [];
  }
}

async function writePendingEffects(client: { set: (key: string, value: unknown) => Promise<unknown> }, effects: EffectRecord[]): Promise<void> {
  await client.set(PENDING_EFFECTS_KEY, effects.slice(0, MAX_PENDING_EFFECTS));
}

async function sendModerationNotification(effect: EffectRecord, requestUrl: URL): Promise<void> {
  const moderationBaseUrl = getModerationBaseUrl(requestUrl);
  const moderationToken = getModerationToken();
  const webhookUrl = normalizeEnvValue(process.env.EFFECT_MODERATION_WEBHOOK_URL) ?? normalizeEnvValue(process.env.DOODLE_MODERATION_WEBHOOK_URL);
  const ntfyUrl = normalizeEnvValue(process.env.EFFECT_MODERATION_NTFY_URL) ?? normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_URL);
  const ntfyToken = normalizeEnvValue(process.env.EFFECT_MODERATION_NTFY_TOKEN) ?? normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_TOKEN);

  if (!moderationBaseUrl || !moderationToken || (!webhookUrl && !ntfyUrl)) {
    return;
  }

  const withAction = (decision: "approve" | "reject"): string => {
    const url = new URL("/api/effects", moderationBaseUrl);
    url.searchParams.set("action", decision);
    url.searchParams.set("id", effect.id);
    url.searchParams.set("token", moderationToken);
    return url.toString();
  };

  const approveUrl = withAction("approve");
  const rejectUrl = withAction("reject");
  const pendingQueueUrl = `${new URL("/api/effects?includePending=1", moderationBaseUrl).toString()}&token=${encodeURIComponent(moderationToken)}`;
  const reviewUrl = getReviewUrl(effect.id, moderationBaseUrl, moderationToken);
  const createdAtIso = new Date(effect.createdAt).toISOString();
  const tasks: Promise<unknown>[] = [];

  if (webhookUrl) {
    tasks.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "effect_submitted",
          effect,
          createdAtIso,
          moderation: { approveUrl, rejectUrl, pendingQueueUrl, reviewUrl }
        })
      })
    );
  }

  if (ntfyUrl) {
    tasks.push(
      fetch(ntfyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": "Effect idea awaiting approval",
          "Priority": "high",
          "Click": reviewUrl ?? pendingQueueUrl,
          ...(ntfyToken ? { Authorization: `Bearer ${ntfyToken}` } : {})
        },
        body: [
          `New effect idea submitted at ${createdAtIso}.`,
          `Name: ${effect.name}`,
          ...(reviewUrl ? [`Review: ${reviewUrl}`] : []),
          `Approve: ${approveUrl}`,
          `Reject: ${rejectUrl}`,
          `Queue API: ${pendingQueueUrl}`
        ].join("\n")
      })
    );
  }

  await Promise.allSettled(tasks);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizeGeneratedParams(value: unknown): GeneratedEffectParam[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const typed = entry as Partial<GeneratedEffectParam>;
    const key = typeof typed.key === "string" ? typed.key.trim() : "";
    const label = typeof typed.label === "string" ? typed.label.trim() : "";
    const type = typed.type;
    if (!key || !label || (type !== "number" && type !== "select" && type !== "toggle")) {
      return [];
    }
    if (type === "number" && !isFiniteNumber(typed.defaultValue)) {
      return [];
    }
    if (type === "toggle" && !isFiniteNumber(typed.defaultValue)) {
      return [];
    }
    if (type === "select" && typeof typed.defaultValue !== "string") {
      return [];
    }
    const options = Array.isArray(typed.options)
      ? typed.options.flatMap((option) => {
        if (!option || typeof option !== "object") {
          return [];
        }
        const typedOption = option as Partial<GeneratedEffectParamOption>;
        if (typeof typedOption.value !== "string" || typeof typedOption.label !== "string") {
          return [];
        }
        return [{
          value: typedOption.value.slice(0, 96),
          label: typedOption.label.slice(0, 96)
        }];
      })
      : undefined;
    return [{
      key: key.slice(0, 64),
      label: label.slice(0, 96),
      type,
      defaultValue: type === "select"
        ? (typed.defaultValue as string).slice(0, 96)
        : Number(typed.defaultValue),
      ...(isFiniteNumber(typed.min) ? { min: typed.min } : {}),
      ...(isFiniteNumber(typed.max) ? { max: typed.max } : {}),
      ...(isFiniteNumber(typed.step) ? { step: typed.step } : {}),
      ...(options && options.length > 0 ? { options } : {}),
      ...(typeof typed.description === "string" && typed.description.trim().length > 0
        ? { description: typed.description.trim().slice(0, 200) }
        : {})
    }];
  });
}

function sanitizeGeneratedDocs(value: unknown): GeneratedEffectDocs | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const typed = value as Partial<GeneratedEffectDocs>;
  if (typeof typed.description !== "string" || typeof typed.parameters !== "string") {
    return undefined;
  }
  return {
    description: typed.description.trim().slice(0, 400),
    parameters: typed.parameters.trim().slice(0, 1600)
  };
}

function sanitizeEffectParamLimits(value: unknown): EffectParamLimitsRecord {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  return Object.entries(raw).reduce<EffectParamLimitsRecord>((effectsAcc, [effectName, effectValue]) => {
    if (!effectValue || typeof effectValue !== "object") {
      return effectsAcc;
    }
    const controlLimits = Object.entries(effectValue as Record<string, unknown>).reduce<Record<string, EffectParamLimitRange>>(
      (limitsAcc, [controlKey, controlValue]) => {
        if (!controlValue || typeof controlValue !== "object") {
          return limitsAcc;
        }
        const typed = controlValue as { min?: unknown; max?: unknown };
        const min = isFiniteNumber(typed.min) ? typed.min : undefined;
        const max = isFiniteNumber(typed.max) ? typed.max : undefined;
        if (min === undefined && max === undefined) {
          return limitsAcc;
        }
        limitsAcc[controlKey] = { min, max };
        return limitsAcc;
      },
      {}
    );
    if (Object.keys(controlLimits).length > 0) {
      effectsAcc[effectName] = controlLimits;
    }
    return effectsAcc;
  }, {});
}

function parseJsonBlock(text: string): {
  name: string;
  typescriptCode: string;
  runtimeCode: string;
  params?: GeneratedEffectParam[];
  docs?: GeneratedEffectDocs;
} | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? text;
  try {
    const parsed = JSON.parse(source) as Partial<{
      name: string;
      typescriptCode: string;
      runtimeCode: string;
      params: unknown;
      docs: unknown;
    }>;
    if (typeof parsed.name !== "string" || typeof parsed.typescriptCode !== "string" || typeof parsed.runtimeCode !== "string") {
      return null;
    }
    const params = sanitizeGeneratedParams(parsed.params);
    const docs = sanitizeGeneratedDocs(parsed.docs);
    return {
      name: parsed.name.slice(0, 96),
      typescriptCode: parsed.typescriptCode,
      runtimeCode: parsed.runtimeCode,
      ...(params.length > 0 ? { params } : {}),
      ...(docs ? { docs } : {})
    };
  } catch {
    return null;
  }
}

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const typed = payload as { output_text?: unknown; output?: Array<{ content?: Array<{ text?: unknown }> }> };
  if (typeof typed.output_text === "string" && typed.output_text.trim().length > 0) {
    return typed.output_text;
  }
  const chunks = (typed.output ?? [])
    .flatMap((entry) => entry.content ?? [])
    .map((content) => (typeof content.text === "string" ? content.text : ""))
    .filter((text) => text.length > 0);
  return chunks.join("\n").trim();
}

async function generateWithOpenAi(prompt: string): Promise<{
  name: string;
  typescriptCode: string;
  runtimeCode: string;
  params?: GeneratedEffectParam[];
  docs?: GeneratedEffectDocs;
}> {
  const apiKey = normalizeEnvValue(process.env.OPENAI_API_KEY);
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = normalizeEnvValue(process.env.OPENAI_CODEX_MODEL) ?? "gpt-5-codex";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You generate canvas demoscene effects.",
                "Return STRICT JSON only with keys: name, typescriptCode, runtimeCode, params, docs.",
                "typescriptCode can use TypeScript syntax.",
                "runtimeCode MUST be plain JavaScript (no TypeScript annotations).",
                "runtimeCode MUST NOT include markdown fences.",
                "runtimeCode MUST NOT include export/import statements.",
                "runtimeCode MUST NOT use dynamic code execution primitives (Function constructor, new Function, eval, import()).",
                "runtimeCode MUST NOT construct code from strings or call methods like setTimeout/setInterval with string arguments.",
                "Prefer deterministic helper functions, lookup tables, and explicit state updates instead of runtime code generation.",
                "runtimeCode MUST evaluate to an effect object with render(context) and optional reset().",
                "Preferred runtimeCode shape: `return { render(context) { ... }, reset() { ... } };`",
                "params MUST be an array of UI control metadata using keys: key,label,type,defaultValue,min,max,step,options,description.",
                "Use type=number with numeric defaults and optional min/max/step.",
                "Use type=toggle with numeric defaultValue of 0 or 1.",
                "Use type=select with string defaultValue and options array of {label,value}.",
                "docs MUST be { description, parameters } where parameters is concise markdown describing each param."
              ].join(" ")
            }
          ]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}).`);
  }

  const payload = (await response.json()) as unknown;
  const text = extractOutputText(payload);
  const parsed = parseJsonBlock(text);
  if (!parsed) {
    const error = new Error("Unable to parse generated effect response.") as Error & { rawResponse?: string };
    error.rawResponse = text.slice(0, 4000);
    throw error;
  }
  return parsed;
}

async function handleModerationAction(res: ResponseLike, url: URL): Promise<boolean> {
  const action = url.searchParams.get("action");
  if (action !== "approve" && action !== "reject") {
    return false;
  }
  if (!isAuthorized(url)) {
    sendHtml(res, 401, "Unauthorized", "This moderation link is invalid or missing a valid token.");
    return true;
  }
  if (!writeClient) {
    sendHtml(res, 503, "Moderation unavailable", "Effect moderation storage is currently unavailable.");
    return true;
  }
  const id = url.searchParams.get("id");
  if (!id) {
    sendHtml(res, 400, "Missing effect", "No effect id was provided for this moderation action.");
    return true;
  }

  const pending = await readPendingEffects(writeClient);
  const target = pending.find((entry) => entry.id === id);
  if (!target) {
    sendHtml(res, 404, "Already handled", "That effect was already approved or rejected.");
    return true;
  }

  const remaining = pending.filter((entry) => entry.id !== id);
  await writePendingEffects(writeClient, remaining);
  if (action === "approve") {
    await writeClient.lpush(EFFECTS_KEY, target);
    await writeClient.ltrim(EFFECTS_KEY, 0, MAX_EFFECTS - 1);
  }

  sendHtml(
    res,
    200,
    action === "approve" ? "Effect approved" : "Effect rejected",
    action === "approve"
      ? `The effect "${target.name}" is approved and can now appear in effect selectors.`
      : `The effect "${target.name}" was rejected and will not be shown in effect selectors.`
  );
  return true;
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  const url = getRequestUrl(req);

  if (await handleModerationAction(res, url)) {
    return;
  }

  if (method === "GET") {
    if (url.searchParams.get("action") === "paramLimits") {
      const sourceClient = readClient ?? writeClient;
      const paramLimits = sanitizeEffectParamLimits(sourceClient ? await sourceClient.get(PARAM_LIMITS_KEY) : null);
      sendJson(res, 200, { paramLimits });
      return;
    }
    if (url.searchParams.get("action") === "generateMetrics") {
      if (!isAuthorized(url)) {
        sendJson(res, 401, { error: "Unauthorized." });
        return;
      }
      const metrics = sanitizeGenerateMetrics(writeClient ? await writeClient.get(GENERATE_METRICS_KEY) : null);
      const samples = sanitizeGenerateErrorSamples(writeClient ? await writeClient.get(GENERATE_ERROR_SAMPLES_KEY) : null);
      sendJson(res, 200, { generateMetrics: metrics, recentGenerateErrors: samples.slice(0, 50) });
      return;
    }
    const effects = await readApprovedEffects();
    if (url.searchParams.has("pendingId")) {
      if (!isAuthorized(url)) {
        sendJson(res, 401, { error: "Unauthorized." });
        return;
      }
      const pendingId = url.searchParams.get("pendingId");
      if (!pendingId) {
        sendJson(res, 400, { error: "A pending effect id is required." });
        return;
      }
      const pendingEffects = await readPendingEffects(readClient ?? writeClient);
      const effect = pendingEffects.find((entry) => entry.id === pendingId);
      if (!effect) {
        sendJson(res, 404, { error: "That pending effect could not be found." });
        return;
      }
      sendJson(res, 200, { effect, reviewUrl: getReviewUrl(effect.id, getModerationBaseUrl(url), getModerationToken()) });
      return;
    }
    if (url.searchParams.get("includePending") === "1") {
      if (!isAuthorized(url)) {
        sendJson(res, 401, { error: "Unauthorized." });
        return;
      }
      const pendingEffects = await readPendingEffects(writeClient);
      sendJson(res, 200, { effects, pendingEffects });
      return;
    }
    sendJson(res, 200, { effects });
    return;
  }

  if (method === "POST" && url.searchParams.get("action") === "generate") {
    const body = await readBody(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const access = getGenerateAccess(req, url);
    const limiter = await consumeGenerateRateLimit(access.identity);
    if (!limiter.allowed) {
      res.setHeader("Retry-After", `${limiter.retryAfterSec}`);
      const waitText = formatRetryWait(limiter.retryAfterSec);
      logGenerateRequest({
        outcome: "rate_limited",
        httpStatus: 429,
        authMode: access.reason,
        identity: access.identity,
        promptLength: prompt.length,
        requestId
      });
      sendJson(res, 429, { error: `Rate limit exceeded. Please wait ${waitText} before trying again.` });
      await recordGenerateMonitoring({
        outcome: "rate_limited",
        httpStatus: 429,
        requestId,
        promptLength: prompt.length,
        authMode: access.reason,
        requestPath: url.pathname,
        error: `Rate limit exceeded. Please wait ${waitText} before trying again.`
      });
      return;
    }
    const globalCap = await consumeGlobalGenerateCap();
    if (!globalCap.allowed) {
      res.setHeader("Retry-After", `${globalCap.retryAfterSec}`);
      const waitText = formatRetryWait(globalCap.retryAfterSec);
      logGenerateRequest({
        outcome: "rate_limited",
        httpStatus: 429,
        authMode: access.reason,
        identity: access.identity,
        promptLength: prompt.length,
        requestId,
        error: `global_daily_cap:${globalCap.limit}`
      });
      sendJson(res, 429, { error: `Daily generation limit reached (${globalCap.limit}/day). Please wait ${waitText} before trying again.` });
      await recordGenerateMonitoring({
        outcome: "rate_limited",
        httpStatus: 429,
        requestId,
        promptLength: prompt.length,
        authMode: access.reason,
        requestPath: url.pathname,
        error: `Daily generation limit reached (${globalCap.limit}/day). Please wait ${waitText} before trying again.`
      });
      return;
    }
    if (!prompt) {
      logGenerateRequest({
        outcome: "rejected",
        httpStatus: 400,
        authMode: access.reason,
        identity: access.identity,
        promptLength: 0,
        requestId
      });
      sendJson(res, 400, { error: "A prompt is required." });
      await recordGenerateMonitoring({
        outcome: "rejected",
        httpStatus: 400,
        requestId,
        promptLength: 0,
        authMode: access.reason,
        requestPath: url.pathname,
        error: "A prompt is required."
      });
      return;
    }
    if (prompt.length > MAX_GENERATE_PROMPT_LENGTH) {
      logGenerateRequest({
        outcome: "rejected",
        httpStatus: 400,
        authMode: access.reason,
        identity: access.identity,
        promptLength: prompt.length,
        requestId
      });
      sendJson(res, 400, { error: `Prompt must be ${MAX_GENERATE_PROMPT_LENGTH} characters or fewer.` });
      await recordGenerateMonitoring({
        outcome: "rejected",
        httpStatus: 400,
        requestId,
        promptLength: prompt.length,
        authMode: access.reason,
        requestPath: url.pathname,
        error: `Prompt must be ${MAX_GENERATE_PROMPT_LENGTH} characters or fewer.`
      });
      return;
    }
    try {
      const generation = await generateWithOpenAi(prompt);
      logGenerateRequest({
        outcome: "accepted",
        httpStatus: 200,
        authMode: access.reason,
        identity: access.identity,
        promptLength: prompt.length,
        requestId
      });
      sendJson(res, 200, { generation });
      await recordGenerateMonitoring({
        outcome: "accepted",
        httpStatus: 200,
        requestId,
        promptLength: prompt.length,
        authMode: access.reason,
        requestPath: url.pathname
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate effect.";
      const rawResponse = error instanceof Error && "rawResponse" in error && typeof (error as { rawResponse?: unknown }).rawResponse === "string"
        ? (error as { rawResponse: string }).rawResponse
        : undefined;
      logGenerateRequest({
        outcome: "error",
        httpStatus: 503,
        authMode: access.reason,
        identity: access.identity,
        promptLength: prompt.length,
        requestId,
        error: message
      });
      sendJson(res, 503, { error: message, rawResponse });
      await recordGenerateMonitoring({
        outcome: "error",
        httpStatus: 503,
        requestId,
        promptLength: prompt.length,
        authMode: access.reason,
        requestPath: url.pathname,
        error: message
      });
    }
    return;
  }

  if (method === "POST") {
    if (url.searchParams.get("action") === "paramLimits") {
      if (!writeClient) {
        sendJson(res, 503, { error: "Effect storage unavailable." });
        return;
      }
      const body = await readBody(req);
      const payload = body.paramLimits ?? body;
      const paramLimits = sanitizeEffectParamLimits(payload);
      await writeClient.set(PARAM_LIMITS_KEY, paramLimits);
      sendJson(res, 200, { paramLimits });
      return;
    }
    if (!writeClient) {
      sendJson(res, 503, { error: "Effect storage unavailable." });
      return;
    }
    const body = await readBody(req);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const typescriptCode = typeof body.typescriptCode === "string" ? body.typescriptCode : "";
    const runtimeCode = typeof body.runtimeCode === "string" ? body.runtimeCode : "";
    const params = sanitizeGeneratedParams(body.params);
    const docs = sanitizeGeneratedDocs(body.docs);
    if (!name || !prompt || !typescriptCode || !runtimeCode) {
      sendJson(res, 400, { error: "name, prompt, typescriptCode, and runtimeCode are required." });
      return;
    }
    const effect: EffectRecord = {
      id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 96),
      prompt: prompt.slice(0, 3000),
      typescriptCode: typescriptCode.slice(0, 20000),
      runtimeCode: runtimeCode.slice(0, 20000),
      ...(params.length > 0 ? { params } : {}),
      ...(docs ? { docs } : {}),
      createdAt: Date.now()
    };

    const pending = await readPendingEffects(writeClient);
    await writePendingEffects(writeClient, [effect, ...pending]);
    await sendModerationNotification(effect, url);
    sendJson(res, 200, { effect, moderationStatus: "pending", reviewUrl: getReviewUrl(effect.id, getModerationBaseUrl(url), getModerationToken()) });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}
