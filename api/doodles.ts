import { createKvClients } from "./kv";

const { readClient, writeClient } = createKvClients();

const DOODLES_KEY = "doodles:items";
const MAX_DOODLES = 48;
const MAX_IMAGE_DATA_LENGTH = 300_000;

export type DoodleRecord = {
  id: string;
  imageData: string;
  createdAt: number;
};

type JsonBody = Record<string, unknown>;

type JsonResponse = {
  doodles?: DoodleRecord[];
  error?: string;
};

function sendJson(
  res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body: string) => void },
  status: number,
  body: JsonResponse
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req: { body?: unknown; on?: (event: string, handler: (chunk: string) => void) => void }): Promise<JsonBody> {
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

export default async function handler(
  req: { method?: string; body?: unknown; on?: (event: string, handler: (chunk: string) => void) => void },
  res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body?: string) => void }
): Promise<void> {
  if (req.method === "GET") {
    if (!readClient) {
      sendJson(res, 200, { doodles: [] });
      return;
    }

    try {
      const doodles = normalizeDoodles(await readClient.lrange(DOODLES_KEY, 0, MAX_DOODLES - 1));
      sendJson(res, 200, { doodles });
    } catch {
      sendJson(res, 200, { doodles: [] });
    }
    return;
  }

  if (req.method === "POST") {
    if (!writeClient) {
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
      await writeClient.lpush(DOODLES_KEY, doodle);
      await writeClient.ltrim(DOODLES_KEY, 0, MAX_DOODLES - 1);
      const doodles = normalizeDoodles(await writeClient.lrange(DOODLES_KEY, 0, MAX_DOODLES - 1));
      sendJson(res, 200, { doodles });
    } catch {
      sendJson(res, 503, { error: "Unable to save doodle right now." });
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end();
}
