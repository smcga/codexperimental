import { EffectParamLimitsByEffect, sanitizeEffectParamLimits } from "./debug/effectParamLimits";
import { pushDatastoreDebugMessage } from "./debug/datastoreStatus";

type EffectParamLimitsResponse = {
  paramLimits?: unknown;
  error?: string;
};

async function requestParamLimits(path: string, init?: RequestInit): Promise<EffectParamLimitsResponse> {
  const method = (init?.method ?? "GET").toUpperCase();
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {})
    },
    ...init
  });
  const dataStore = response.headers?.get?.("x-data-store") ?? "unknown";
  pushDatastoreDebugMessage(`${method} paramLimits → ${dataStore}`);
  const storeNote = response.headers?.get?.("x-data-store-note");
  if (storeNote) {
    pushDatastoreDebugMessage(`paramLimits fallback: ${storeNote}`, "warn");
  }
  const payload = (await response.json()) as EffectParamLimitsResponse;
  if (!response.ok) {
    pushDatastoreDebugMessage(`paramLimits ${response.status}`, "warn");
    throw new Error(typeof payload.error === "string" && payload.error ? payload.error : "Unable to load param limits.");
  }
  return payload;
}

export async function fetchGlobalEffectParamLimits(): Promise<EffectParamLimitsByEffect> {
  const payload = await requestParamLimits("/api/effects?action=paramLimits", { method: "GET" });
  return sanitizeEffectParamLimits(payload.paramLimits);
}

export async function saveGlobalEffectParamLimits(paramLimits: EffectParamLimitsByEffect): Promise<EffectParamLimitsByEffect> {
  const payload = await requestParamLimits("/api/effects?action=paramLimits", {
    method: "POST",
    body: JSON.stringify({ paramLimits })
  });
  return sanitizeEffectParamLimits(payload.paramLimits);
}
