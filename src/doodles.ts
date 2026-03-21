export type DoodleRecord = {
  id: string;
  imageData: string;
  createdAt: number;
};

type DoodlesResponse = {
  doodles?: DoodleRecord[];
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

async function requestDoodles(init?: RequestInit): Promise<DoodleRecord[]> {
  const response = await fetch("/api/doodles", {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Doodle request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as DoodlesResponse;
  doodleCache = normalizeDoodles(payload.doodles);
  return doodleCache;
}

export async function fetchDoodles(forceRefresh = false): Promise<DoodleRecord[]> {
  if (!forceRefresh && doodleCache.length > 0) {
    return doodleCache;
  }

  if (!forceRefresh && doodlesRequest) {
    return doodlesRequest;
  }

  doodlesRequest = requestDoodles({ method: "GET" })
    .catch(() => doodleCache)
    .finally(() => {
      doodlesRequest = null;
    });

  return doodlesRequest;
}

export async function submitDoodle(imageData: string): Promise<DoodleRecord[]> {
  const doodles = await requestDoodles({
    method: "POST",
    body: JSON.stringify({ imageData })
  });
  return doodles;
}

export function getCachedDoodles(): DoodleRecord[] {
  return doodleCache;
}

export function clearDoodleCache(): void {
  doodleCache = [];
  doodlesRequest = null;
}
