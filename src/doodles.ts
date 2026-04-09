export type DoodleRecord = {
  id: string;
  imageData: string;
  createdAt: number;
};

export type DoodleSubmissionResult = {
  doodle: DoodleRecord | null;
  moderationStatus: "pending" | null;
  reviewUrl: string | null;
};

type DoodlesResponse = {
  doodles?: DoodleRecord[];
  doodle?: DoodleRecord;
  moderationStatus?: "pending";
  reviewUrl?: string | null;
  error?: string;
};

let doodleCache: DoodleRecord[] = [];
let doodlesRequest: Promise<DoodleRecord[]> | null = null;

function normalizeDoodles(value: unknown): DoodleRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const doodle = entry as Partial<DoodleRecord>;
    if (
      typeof doodle.id !== "string" ||
      typeof doodle.imageData !== "string" ||
      !doodle.imageData.startsWith("data:image/png;base64,") ||
      typeof doodle.createdAt !== "number" ||
      !Number.isFinite(doodle.createdAt)
    ) {
      return [];
    }

    return [{ id: doodle.id, imageData: doodle.imageData, createdAt: doodle.createdAt }];
  });
}

function normalizeDoodle(value: unknown): DoodleRecord | null {
  return normalizeDoodles(value ? [value] : [])[0] ?? null;
}

async function requestDoodles(path = "/api/doodles", init?: RequestInit): Promise<DoodlesResponse> {
  const method = (init?.method ?? "GET").toUpperCase();
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {})
    },
    ...init
  });
  const dataStore = response.headers?.get?.("x-data-store") ?? "unknown";
  pushDatastoreDebugMessage(`${method} doodles → ${dataStore}`);

  if (!response.ok) {
    pushDatastoreDebugMessage(`doodles ${response.status}`, "warn");
    throw new Error(`Doodle request failed with status ${response.status}`);
  }

  return (await response.json()) as DoodlesResponse;
}

export function buildModerationActionUrl(action: "approve" | "reject", id: string, token: string): string {
  const params = new URLSearchParams({ action, id, token });
  return `/api/doodles?${params.toString()}`;
}

export async function fetchPendingDoodle(id: string, token: string): Promise<{ doodle: DoodleRecord | null; reviewUrl: string | null }> {
  const params = new URLSearchParams({ pendingId: id, token });
  const payload = await requestDoodles(`/api/doodles?${params.toString()}`, { method: "GET" });
  return {
    doodle: normalizeDoodle(payload.doodle),
    reviewUrl: payload.reviewUrl ?? null
  };
}

export async function fetchDoodles(forceRefresh = false): Promise<DoodleRecord[]> {
  if (!forceRefresh && doodleCache.length > 0) {
    return doodleCache;
  }

  if (!forceRefresh && doodlesRequest) {
    return doodlesRequest;
  }

  doodlesRequest = requestDoodles("/api/doodles", { method: "GET" })
    .then((payload) => {
      doodleCache = normalizeDoodles(payload.doodles);
      return doodleCache;
    })
    .catch(() => doodleCache)
    .finally(() => {
      doodlesRequest = null;
    });

  return doodlesRequest;
}

export async function submitDoodle(imageData: string): Promise<DoodleSubmissionResult> {
  const payload = await requestDoodles("/api/doodles", {
    method: "POST",
    body: JSON.stringify({ imageData })
  });

  return {
    doodle: normalizeDoodle(payload.doodle),
    moderationStatus: payload.moderationStatus ?? null,
    reviewUrl: payload.reviewUrl ?? null
  };
}

export function getCachedDoodles(): DoodleRecord[] {
  return doodleCache;
}

export function clearDoodleCache(): void {
  doodleCache = [];
  doodlesRequest = null;
}
import { pushDatastoreDebugMessage } from "./debug/datastoreStatus";
