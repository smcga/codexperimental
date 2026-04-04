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
  error?: string;
  rawResponse?: string;
};

let approvedCache: EffectIdeaRecord[] = [];

export class EffectIdeaApiError extends Error {
  rawResponse: string | null;

  constructor(message: string, rawResponse: string | null = null) {
    super(message);
    this.name = "EffectIdeaApiError";
    this.rawResponse = rawResponse;
  }
}

function normalizeGeneratedCode(rawCode: string): string {
  return rawCode
    .replace(/^\s*```[a-z]*\s*/iu, "")
    .replace(/\s*```\s*$/u, "")
    .replace(/^\s*type\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*[\s\S]*?;\s*$/gmu, "")
    .replace(/^\s*interface\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\{[\s\S]*?\}\s*$/gmu, "")
    .replace(/\bexport\s+default\s+/gu, "")
    .replace(/\bexport\s+/gu, "")
    .replace(/\)\s*:\s*[A-Za-z_$][A-Za-z0-9_$<>\[\]\|, \t]*(?=\s*\{)/gu, ")")
    .replace(/\(([^()]*)\)/gu, (match, params: string) => {
      if (!params.includes(":")) {
        return match;
      }
      const stripped = params.replace(/([A-Za-z_$][A-Za-z0-9_$]*)\s*\??:\s*[^,)=]+/gu, "$1");
      return `(${stripped})`;
    });
}

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

  const payload = (await response.json()) as EffectsResponse;
  if (!response.ok) {
    const message = typeof payload.error === "string" && payload.error.trim().length > 0
      ? payload.error
      : `Effect idea request failed: ${response.status}`;
    const rawResponse = typeof payload.rawResponse === "string" && payload.rawResponse.length > 0 ? payload.rawResponse : null;
    throw new EffectIdeaApiError(message, rawResponse);
  }
  return payload;
}

export function compileRuntimeEffect(runtimeCode: string): Effect {
  const normalizedCode = normalizeGeneratedCode(runtimeCode);
  const factory = new Function(
    `"use strict";
${normalizedCode}
const candidate =
  (typeof createEffect === "function" ? createEffect
    : typeof createDemo === "function" ? createDemo
    : typeof effectFactory === "function" ? effectFactory
    : typeof demoFactory === "function" ? demoFactory
    : typeof effect === "object" && effect ? effect
    : typeof demo === "object" && demo ? demo
    : null);
if (typeof candidate === "function") {
  return candidate();
}
if (candidate && typeof candidate === "object") {
  return candidate;
}
return (() => {${normalizedCode}})();`
  ) as () => Effect;
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
