import { pushDatastoreDebugMessage } from "./debug/datastoreStatus";

type ViewsResponse = {
  count?: number;
};

export type LiveViewSubscriptionOptions = {
  intervalMs?: number;
  fetchOnStart?: boolean;
};

function isValidCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function fetchViews(): Promise<number> {
  try {
    const response = await fetch("/api/views", {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
    const dataStore = response.headers?.get?.("x-data-store") ?? "unknown";
    pushDatastoreDebugMessage(`GET views → ${dataStore}`);
    if (!response.ok) {
      pushDatastoreDebugMessage(`views ${response.status}`, "warn");
      return 0;
    }
    const data = (await response.json()) as ViewsResponse;
    return isValidCount(data.count) ? data.count : 0;
  } catch {
    return 0;
  }
}

export function subscribeToLiveViews(onCount: (count: number) => void, options: LiveViewSubscriptionOptions = {}): () => void {
  const intervalMs = Math.max(500, options.intervalMs ?? 5000);
  const fetchOnStart = options.fetchOnStart ?? true;

  const tick = () => {
    void fetchViews().then((count) => {
      onCount(count);
    });
  };

  if (fetchOnStart) {
    tick();
  }

  const timerId = globalThis.setInterval(tick, intervalMs);

  return () => {
    globalThis.clearInterval(timerId);
  };
}

export async function registerViewOncePerSession(): Promise<number | null> {
  try {
    if (sessionStorage.getItem("viewCounted") === "1") {
      return null;
    }
  } catch {
    // Ignore storage errors and continue with best-effort registration.
  }

  try {
    const response = await fetch("/api/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const dataStore = response.headers?.get?.("x-data-store") ?? "unknown";
    pushDatastoreDebugMessage(`POST views → ${dataStore}`);
    if (!response.ok) {
      pushDatastoreDebugMessage(`views ${response.status}`, "warn");
      return null;
    }
    const data = (await response.json()) as ViewsResponse;
    if (!isValidCount(data.count)) {
      return null;
    }

    try {
      sessionStorage.setItem("viewCounted", "1");
    } catch {
      // Ignore storage errors and continue with best-effort registration.
    }

    return data.count;
  } catch {
    return null;
  }
}
