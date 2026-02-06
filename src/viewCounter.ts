type ViewsResponse = {
  count?: number;
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
    if (!response.ok) {
      return 0;
    }
    const data = (await response.json()) as ViewsResponse;
    return isValidCount(data.count) ? data.count : 0;
  } catch {
    return 0;
  }
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
    if (!response.ok) {
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
