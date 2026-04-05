import { createKvClients } from "./kv.js";

const { readClient, writeClient } = createKvClients();

const EFFECTS_KEY = "effects:items";
const PENDING_EFFECTS_KEY = "effects:pending";
const MAX_EFFECTS = 128;
const MAX_PENDING_EFFECTS = 128;
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
  createdAt: number;
};

type JsonBody = Record<string, unknown>;

type JsonResponse = {
  effects?: EffectRecord[];
  effect?: EffectRecord;
  pendingEffects?: EffectRecord[];
  moderationStatus?: "pending" | "approved" | "rejected";
  generation?: {
    name: string;
    typescriptCode: string;
    runtimeCode: string;
  };
  error?: string;
  rawResponse?: string;
};

function sendJson(res: ResponseLike, status: number, body: JsonResponse): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
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

function normalizeEffects(value: unknown): EffectRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => (isEffectRecord(entry) ? [entry] : []));
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
    return normalizeEffects(await client.get(PENDING_EFFECTS_KEY));
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
          moderation: { approveUrl, rejectUrl, pendingQueueUrl }
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
          "Click": pendingQueueUrl,
          ...(ntfyToken ? { Authorization: `Bearer ${ntfyToken}` } : {})
        },
        body: [
          `New effect idea submitted at ${createdAtIso}.`,
          `Name: ${effect.name}`,
          `Approve: ${approveUrl}`,
          `Reject: ${rejectUrl}`,
          `Queue API: ${pendingQueueUrl}`
        ].join("\n")
      })
    );
  }

  await Promise.allSettled(tasks);
}

function parseJsonBlock(text: string): { name: string; typescriptCode: string; runtimeCode: string } | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? text;
  try {
    const parsed = JSON.parse(source) as Partial<{ name: string; typescriptCode: string; runtimeCode: string }>;
    if (typeof parsed.name !== "string" || typeof parsed.typescriptCode !== "string" || typeof parsed.runtimeCode !== "string") {
      return null;
    }
    return {
      name: parsed.name.slice(0, 96),
      typescriptCode: parsed.typescriptCode,
      runtimeCode: parsed.runtimeCode
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

async function generateWithOpenAi(prompt: string): Promise<{ name: string; typescriptCode: string; runtimeCode: string }> {
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
                "Return STRICT JSON only with keys: name, typescriptCode, runtimeCode.",
                "typescriptCode can use TypeScript syntax.",
                "runtimeCode MUST be plain JavaScript (no TypeScript annotations).",
                "runtimeCode MUST NOT include markdown fences.",
                "runtimeCode MUST NOT include export/import statements.",
                "runtimeCode MUST evaluate to an effect object with render(context) and optional reset().",
                "Preferred runtimeCode shape: `return { render(context) { ... }, reset() { ... } };`"
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
    sendJson(res, 401, { error: "Unauthorized moderation action." });
    return true;
  }
  if (!writeClient) {
    sendJson(res, 503, { error: "Moderation storage unavailable." });
    return true;
  }
  const id = url.searchParams.get("id");
  if (!id) {
    sendJson(res, 400, { error: "Missing effect id." });
    return true;
  }

  const pending = await readPendingEffects(writeClient);
  const target = pending.find((entry) => entry.id === id);
  if (!target) {
    sendJson(res, 404, { error: "Pending effect not found." });
    return true;
  }

  const remaining = pending.filter((entry) => entry.id !== id);
  await writePendingEffects(writeClient, remaining);
  if (action === "approve") {
    await writeClient.lpush(EFFECTS_KEY, target);
    await writeClient.ltrim(EFFECTS_KEY, 0, MAX_EFFECTS - 1);
  }

  sendJson(res, 200, {
    effect: target,
    moderationStatus: action === "approve" ? "approved" : "rejected"
  });
  return true;
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  const method = (req.method ?? "GET").toUpperCase();
  const url = getRequestUrl(req);

  if (await handleModerationAction(res, url)) {
    return;
  }

  if (method === "GET") {
    const effects = await readApprovedEffects();
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
    if (!prompt) {
      sendJson(res, 400, { error: "A prompt is required." });
      return;
    }
    try {
      const generation = await generateWithOpenAi(prompt);
      sendJson(res, 200, { generation });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate effect.";
      const rawResponse = error instanceof Error && "rawResponse" in error && typeof (error as { rawResponse?: unknown }).rawResponse === "string"
        ? (error as { rawResponse: string }).rawResponse
        : undefined;
      sendJson(res, 503, { error: message, rawResponse });
    }
    return;
  }

  if (method === "POST") {
    if (!writeClient) {
      sendJson(res, 503, { error: "Effect storage unavailable." });
      return;
    }
    const body = await readBody(req);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const typescriptCode = typeof body.typescriptCode === "string" ? body.typescriptCode : "";
    const runtimeCode = typeof body.runtimeCode === "string" ? body.runtimeCode : "";
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
      createdAt: Date.now()
    };

    const pending = await readPendingEffects(writeClient);
    await writePendingEffects(writeClient, [effect, ...pending]);
    await sendModerationNotification(effect, url);
    sendJson(res, 200, { effect, moderationStatus: "pending" });
    return;
  }

  sendJson(res, 405, { error: "Method not allowed" });
}
