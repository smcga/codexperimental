import { Effect } from "./renderer/effects/types";

export type EffectIdeaRecord = {
  id: string;
  name: string;
  prompt: string;
  typescriptCode: string;
  runtimeCode: string;
  createdAt: number;
};

export type EffectIdeaGenerationResult = {
  name: string;
  typescriptCode: string;
  runtimeCode: string;
};

type EffectsResponse = {
  effects?: EffectIdeaRecord[];
  effect?: EffectIdeaRecord;
  moderationStatus?: "pending";
  generation?: EffectIdeaGenerationResult;
};

let approvedCache: EffectIdeaRecord[] = [];

function isRecord(value: unknown): value is EffectIdeaRecord {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Partial<EffectIdeaRecord>;
  return (
    typeof entry.id === "string"
    && typeof entry.name === "string"
    && typeof entry.prompt === "string"
    && typeof entry.typescriptCode === "string"
    && typeof entry.runtimeCode === "string"
    && typeof entry.createdAt === "number"
    && Number.isFinite(entry.createdAt)
  );
}

function normalizeEffects(value: unknown): EffectIdeaRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((entry) => (isRecord(entry) ? [entry] : []));
}

async function requestEffects(path = "/api/effects", init?: RequestInit): Promise<EffectsResponse> {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {})
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Effect idea request failed: ${response.status}`);
  }

  return (await response.json()) as EffectsResponse;
}

export function compileRuntimeEffect(runtimeCode: string): Effect {
  const factory = new Function(`"use strict";${runtimeCode}`) as () => Effect;
  const effect = factory();
  if (!effect || typeof effect.render !== "function") {
    throw new Error("Generated effect is missing a render function.");
  }
  return effect;
}

export async function generateEffectIdea(prompt: string): Promise<EffectIdeaGenerationResult> {
  const payload = await requestEffects("/api/effects?action=generate", {
    method: "POST",
    body: JSON.stringify({ prompt })
  });
  if (!payload.generation) {
    throw new Error("No generation returned.");
  }
  return payload.generation;
}

export async function submitEffectIdea(idea: Omit<EffectIdeaRecord, "id" | "createdAt">): Promise<void> {
  await requestEffects("/api/effects", {
    method: "POST",
    body: JSON.stringify(idea)
  });
}

export async function fetchApprovedEffects(forceRefresh = false): Promise<EffectIdeaRecord[]> {
  if (!forceRefresh && approvedCache.length > 0) {
    return approvedCache;
  }
  const payload = await requestEffects("/api/effects", { method: "GET" });
  approvedCache = normalizeEffects(payload.effects);
  return approvedCache;
}

export function getCachedApprovedEffects(): EffectIdeaRecord[] {
  return approvedCache;
}

export function clearApprovedEffectsCache(): void {
  approvedCache = [];
}
