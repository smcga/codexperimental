import { createKvClients } from "./kv.js";
import { createDbClient, getDbDiagnostics } from "./db.js";

const { readClient, writeClient } = createKvClients();
const dbClient = createDbClient();

const DOODLES_KEY = "doodles:items";
const PENDING_DOODLES_KEY = "doodles:pending";
const MAX_DOODLES = 48;
const MAX_PENDING_DOODLES = 96;
const MAX_IMAGE_DATA_LENGTH = 300_000;
const MODERATION_TOKEN_ENV_KEYS = ["DOODLE_MODERATION_TOKEN", "DOODLE_ADMIN_TOKEN"];

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

export type DoodleRecord = {
  id: string;
  imageData: string;
  createdAt: number;
};

type JsonBody = Record<string, unknown>;

type JsonResponse = {
  doodles?: DoodleRecord[];
  pendingDoodles?: DoodleRecord[];
  doodle?: DoodleRecord;
  moderationStatus?: "pending" | "approved" | "rejected";
  reviewUrl?: string | null;
  error?: string;
};

function getDatastoreMeta(): { label: string; note?: string } {
  const diagnostics = getDbDiagnostics();
  if (dbClient) {
    return { label: "postgres" };
  }
  if (diagnostics.configured && (readClient || writeClient)) {
    return { label: "upstash-kv-fallback", note: diagnostics.initError ?? "db_client_unavailable" };
  }
  if (readClient || writeClient) {
    return { label: "upstash-kv" };
  }
  return { label: "none", ...(diagnostics.configured ? { note: diagnostics.initError ?? "db_client_unavailable" } : {}) };
}

function sendJson(res: ResponseLike, status: number, body: JsonResponse): void {
  const datastore = getDatastoreMeta();
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Data-Store", datastore.label);
  if (datastore.note) {
    res.setHeader("X-Data-Store-Note", datastore.note);
  }
  res.end(JSON.stringify(body));
}

function sendHtml(res: ResponseLike, status: number, title: string, message: string): void {
  const datastore = getDatastoreMeta();
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Data-Store", datastore.label);
  if (datastore.note) {
    res.setHeader("X-Data-Store-Note", datastore.note);
  }
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${title}</title><style>body{margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#05070f;color:#e8f7ff;display:grid;place-items:center;min-height:100vh;padding:24px}.card{max-width:520px;padding:24px;border:1px solid rgba(142,249,255,.25);background:rgba(2,6,10,.95);box-shadow:0 0 32px rgba(0,0,0,.45)}h1{margin:0 0 12px;font-size:1.4rem;letter-spacing:.06em;text-transform:uppercase}p{margin:0;color:rgba(232,247,255,.82);line-height:1.6}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`);
}

async function readBody(req: RequestLike): Promise<JsonBody> {
  if (req.body instanceof Uint8Array) {
    const text = new TextDecoder().decode(req.body);
    try {
      return JSON.parse(text) as JsonBody;
    } catch {
      return {};
    }
  }

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as JsonBody;
    } catch {
      return {};
    }
  }

  if (req.body && typeof req.body === "object") {
    return req.body as JsonBody;
  }

  if (typeof req.on !== "function") {
    return {};
  }

  return await new Promise<JsonBody>((resolve) => {
    let raw = "";
    req.on?.("data", (chunk) => {
      raw += chunk;
    });
    req.on?.("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw) as JsonBody);
      } catch {
        resolve({});
      }
    });
  });
}

function normalizeDoodles(value: unknown): DoodleRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const candidate = entry as Partial<DoodleRecord>;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.imageData !== "string" ||
      !candidate.imageData.startsWith("data:image/png;base64,") ||
      typeof candidate.createdAt !== "number" ||
      !Number.isFinite(candidate.createdAt)
    ) {
      return [];
    }

    return [{ id: candidate.id, imageData: candidate.imageData, createdAt: candidate.createdAt }];
  });
}

function isValidImageData(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/png;base64,") && value.length <= MAX_IMAGE_DATA_LENGTH;
}

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

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }
  return typeof value === "string" ? value : null;
}

function getRequestUrl(req: RequestLike): URL {
  const rawUrl = req.url ?? "/api/doodles";
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
  if (!token) {
    return false;
  }
  return url.searchParams.get("token") === token;
}

function getModerationBaseUrl(requestUrl: URL): string | null {
  const configured = normalizeEnvValue(process.env.DOODLE_MODERATION_BASE_URL)
    ?? normalizeEnvValue(process.env.SITE_URL)
    ?? normalizeEnvValue(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    ?? normalizeEnvValue(process.env.VERCEL_URL);

  const candidate = configured ? new URL(configured.startsWith("http") ? configured : `https://${configured}`) : requestUrl;
  if (!candidate.protocol.startsWith("http")) {
    return null;
  }
  return `${candidate.protocol}//${candidate.host}`;
}

function getReviewUrl(doodleId: string, moderationBaseUrl: string | null, moderationToken: string | null): string | null {
  if (!moderationBaseUrl || !moderationToken) {
    return null;
  }

  const url = new URL("/review.html", moderationBaseUrl);
  url.searchParams.set("id", doodleId);
  url.searchParams.set("token", moderationToken);
  return url.toString();
}

async function readApprovedDoodles(): Promise<DoodleRecord[]> {
  if (dbClient) {
    try {
      const rows = await dbClient.doodleSubmission.findMany({
        where: { status: "approved" },
        orderBy: { createdAt: "desc" },
        take: MAX_DOODLES
      });
      return rows.map((row) => ({
        id: row.id,
        imageData: row.imageData,
        createdAt: row.createdAt.getTime()
      }));
    } catch {
      return [];
    }
  }

  if (!readClient) {
    return [];
  }

  try {
    return normalizeDoodles(await readClient.lrange(DOODLES_KEY, 0, MAX_DOODLES - 1));
  } catch {
    return [];
  }
}

async function readPendingDoodles(client: { get: (key: string) => Promise<unknown> } | null): Promise<DoodleRecord[]> {
  if (dbClient) {
    try {
      const rows = await dbClient.doodleSubmission.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
        take: MAX_PENDING_DOODLES
      });
      return rows.map((row) => ({
        id: row.id,
        imageData: row.imageData,
        createdAt: row.createdAt.getTime()
      }));
    } catch {
      return [];
    }
  }

  if (!client) {
    return [];
  }

  try {
    return normalizeDoodles(await client.get(PENDING_DOODLES_KEY));
  } catch {
    return [];
  }
}

async function writePendingDoodles(client: { set: (key: string, value: unknown) => Promise<unknown> }, doodles: DoodleRecord[]): Promise<void> {
  await client.set(PENDING_DOODLES_KEY, doodles.slice(0, MAX_PENDING_DOODLES));
}

async function sendModerationNotification(doodle: DoodleRecord, requestUrl: URL): Promise<void> {
  const moderationBaseUrl = getModerationBaseUrl(requestUrl);
  const moderationToken = getModerationToken();
  const webhookUrl = normalizeEnvValue(process.env.DOODLE_MODERATION_WEBHOOK_URL);
  const ntfyUrl = normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_URL);
  const ntfyToken = normalizeEnvValue(process.env.DOODLE_MODERATION_NTFY_TOKEN);

  if (!webhookUrl && !ntfyUrl) {
    return;
  }

  const withAction = (decision: "approve" | "reject"): string | null => {
    if (!moderationBaseUrl || !moderationToken) {
      return null;
    }
    const url = new URL("/api/doodles", moderationBaseUrl);
    url.searchParams.set("action", decision);
    url.searchParams.set("id", doodle.id);
    url.searchParams.set("token", moderationToken);
    return url.toString();
  };

  const approveUrl = withAction("approve");
  const rejectUrl = withAction("reject");
  const reviewUrl = getReviewUrl(doodle.id, moderationBaseUrl, moderationToken);
  const pendingQueueUrl = moderationBaseUrl && moderationToken
    ? `${new URL("/api/doodles?includePending=1", moderationBaseUrl).toString()}&token=${encodeURIComponent(moderationToken)}`
    : null;

  const createdAtIso = new Date(doodle.createdAt).toISOString();
  const tasks: Promise<unknown>[] = [];

  if (webhookUrl) {
    tasks.push(
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "doodle_submitted",
          doodle,
          createdAtIso,
          moderation: { approveUrl, rejectUrl, reviewUrl, pendingQueueUrl }
        })
      })
    );
  }

  if (ntfyUrl) {
    const lines = [
      `New doodle submitted at ${createdAtIso}.`,
      reviewUrl
        ? "Tap this notification to open the doodle review page, then approve or deny it there."
        : "Doodle review page unavailable because the moderation URL/token is not configured.",
      pendingQueueUrl ? `Queue API: ${pendingQueueUrl}` : "Queue API unavailable."
    ];

    tasks.push(
      fetch(ntfyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Title": "Doodle awaiting approval",
          "Priority": "high",
          ...(reviewUrl ? { "Click": reviewUrl } : {}),
          ...(ntfyToken ? { Authorization: `Bearer ${ntfyToken}` } : {})
        },
        body: lines.join("\n")
      })
    );
  }

  await Promise.allSettled(tasks);
}

async function handleModerationAction(req: RequestLike, res: ResponseLike, url: URL): Promise<boolean> {
  const action = url.searchParams.get("action");
  if (action !== "approve" && action !== "reject") {
    return false;
  }

  if (!isAuthorized(url)) {
    sendHtml(res, 401, "Unauthorized", "This moderation link is missing a valid token.");
    return true;
  }

  if (!writeClient && !dbClient) {
    sendHtml(res, 503, "Moderation unavailable", "Doodle moderation storage is unavailable right now.");
    return true;
  }

  const id = url.searchParams.get("id");
  if (!id) {
    sendHtml(res, 400, "Missing doodle", "No doodle id was provided for this moderation action.");
    return true;
  }

  if (dbClient) {
    try {
      const existing = await dbClient.doodleSubmission.findUnique({
        where: { id }
      });
      if (!existing || existing.status !== "pending") {
        sendHtml(res, 404, "Already handled", "That doodle was already approved or rejected.");
        return true;
      }

      await dbClient.doodleSubmission.update({
        where: { id },
        data: { status: action === "approve" ? "approved" : "rejected", moderatedAt: new Date() }
      });
    } catch {
      sendHtml(res, 503, "Moderation unavailable", "Unable to update the doodle queue right now.");
      return true;
    }
  } else if (writeClient) {
    const pendingDoodles = await readPendingDoodles(writeClient);
    const target = pendingDoodles.find((doodle) => doodle.id === id);
    if (!target) {
      sendHtml(res, 404, "Already handled", "That doodle was already approved or rejected.");
      return true;
    }

    const remaining = pendingDoodles.filter((doodle) => doodle.id !== id);

    try {
      await writePendingDoodles(writeClient, remaining);
      if (action === "approve") {
        await writeClient.lpush(DOODLES_KEY, target);
        await writeClient.ltrim(DOODLES_KEY, 0, MAX_DOODLES - 1);
      }
    } catch {
      sendHtml(res, 503, "Moderation unavailable", "Unable to update the doodle queue right now.");
      return true;
    }
  }

  sendHtml(
    res,
    200,
    action === "approve" ? "Doodle approved" : "Doodle rejected",
    action === "approve"
      ? "The doodle is approved and can now appear on the doodle wall."
      : "The doodle was rejected and will stay out of the doodle wall."
  );
  return true;
}

export default async function handler(req: RequestLike, res: ResponseLike): Promise<void> {
  const url = getRequestUrl(req);

  if (req.method === "GET") {
    if (await handleModerationAction(req, res, url)) {
      return;
    }

    if (url.searchParams.has("pendingId")) {
      if (!isAuthorized(url)) {
        sendJson(res, 401, { error: "A valid moderation token is required." });
        return;
      }

      const pendingId = url.searchParams.get("pendingId");
      if (!pendingId) {
        sendJson(res, 400, { error: "A pending doodle id is required." });
        return;
      }

      const pendingDoodles = await readPendingDoodles(readClient ?? writeClient);
      const doodle = pendingDoodles.find((entry) => entry.id === pendingId);
      if (!doodle) {
        sendJson(res, 404, { error: "That pending doodle could not be found." });
        return;
      }

      sendJson(res, 200, { doodle, reviewUrl: getReviewUrl(doodle.id, getModerationBaseUrl(url), getModerationToken()) });
      return;
    }

    const doodles = await readApprovedDoodles();

    if (url.searchParams.get("includePending") === "1") {
      if (!isAuthorized(url)) {
        sendJson(res, 401, { error: "A valid moderation token is required." });
        return;
      }

      const pendingDoodles = await readPendingDoodles(readClient ?? writeClient);
      sendJson(res, 200, { doodles, pendingDoodles });
      return;
    }

    sendJson(res, 200, { doodles });
    return;
  }

  if (req.method === "POST") {
    if (!writeClient && !dbClient) {
      sendJson(res, 503, { error: "Doodle storage is unavailable." });
      return;
    }

    const body = await readBody(req);
    if (!isValidImageData(body.imageData)) {
      sendJson(res, 400, { error: "A PNG doodle is required." });
      return;
    }

    const doodle: DoodleRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      imageData: body.imageData,
      createdAt: Date.now()
    };

    try {
      if (dbClient) {
        await dbClient.doodleSubmission.create({
          data: {
            id: doodle.id,
            imageData: doodle.imageData,
            createdAt: new Date(doodle.createdAt),
            status: "pending"
          }
        });
      } else if (writeClient) {
        const pendingDoodles = await readPendingDoodles(writeClient);
        await writePendingDoodles(writeClient, [doodle, ...pendingDoodles]);
      }
      await sendModerationNotification(doodle, url);
      sendJson(res, 200, { doodle, moderationStatus: "pending", reviewUrl: getReviewUrl(doodle.id, getModerationBaseUrl(url), getModerationToken()) });
    } catch {
      sendJson(res, 503, { error: "Unable to save doodle right now." });
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end();
}
