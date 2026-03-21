export type DoodleRecord = {
  id: string;
  imageData: string;
  createdAt: number;
};

export type DoodleSubmissionResult = {
  doodle: DoodleRecord | null;
  moderationStatus: "pending" | null;
};

type DoodlesResponse = {
  doodles?: DoodleRecord[];
  doodle?: DoodleRecord;
  moderationStatus?: "pending";
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

async function requestDoodles(init?: RequestInit): Promise<DoodlesResponse> {
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

  return (await response.json()) as DoodlesResponse;
}

export async function fetchDoodles(forceRefresh = false): Promise<DoodleRecord[]> {
  if (!forceRefresh && doodleCache.length > 0) {
    return doodleCache;
  }

  if (!forceRefresh && doodlesRequest) {
    return doodlesRequest;
  }

  doodlesRequest = requestDoodles({ method: "GET" })
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
  const payload = await requestDoodles({
    method: "POST",
    body: JSON.stringify({ imageData })
  });

  return {
    doodle: normalizeDoodle(payload.doodle),
    moderationStatus: payload.moderationStatus ?? null
  };
}

export function getCachedDoodles(): DoodleRecord[] {
  return doodleCache;
}

export function clearDoodleCache(): void {
  doodleCache = [];
  doodlesRequest = null;
}
