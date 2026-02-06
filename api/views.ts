import { Redis } from "@upstash/redis";

const redisUrl = process.env.KV_REST_API_URL ?? process.env.KV_URL ?? process.env.REDIS_URL;
const redisWriteToken = process.env.KV_REST_API_TOKEN;
const redisReadToken = process.env.KV_REST_API_READ_ONLY_TOKEN ?? redisWriteToken;

const readClient = redisUrl && redisReadToken ? new Redis({ url: redisUrl, token: redisReadToken }) : null;
const writeClient = redisUrl && redisWriteToken ? new Redis({ url: redisUrl, token: redisWriteToken }) : null;

type JsonResponse = {
  count: number;
};

function sendJson(res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body: string) => void }, status: number, body: JsonResponse): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export default async function handler(
  req: { method?: string },
  res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body?: string) => void }
): Promise<void> {
  if (req.method === "GET") {
    if (!readClient) {
      sendJson(res, 200, { count: 0 });
      return;
    }
    try {
      const count = (await readClient.get<number>("views:total")) ?? 0;
      sendJson(res, 200, { count });
    } catch {
      sendJson(res, 200, { count: 0 });
    }
    return;
  }

  if (req.method === "POST") {
    if (!writeClient) {
      sendJson(res, 503, { count: 0 });
      return;
    }
    try {
      const count = await writeClient.incr("views:total");
      sendJson(res, 200, { count });
    } catch {
      sendJson(res, 503, { count: 0 });
    }
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end();
}
