import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

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
    if (!redis) {
      sendJson(res, 200, { count: 0 });
      return;
    }
    try {
      const count = (await redis.get<number>("views:total")) ?? 0;
      sendJson(res, 200, { count });
    } catch {
      sendJson(res, 200, { count: 0 });
    }
    return;
  }

  if (req.method === "POST") {
    if (!redis) {
      sendJson(res, 503, { count: 0 });
      return;
    }
    try {
      const count = await redis.incr("views:total");
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
