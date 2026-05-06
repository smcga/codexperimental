import ts from "typescript";

import { Effect } from "./renderer/effects/types";

export type GeneratedEffectParamOption = {
  label: string;
  value: string;
};

export type GeneratedEffectParam = {
  key: string;
  label: string;
  type: "number" | "select" | "toggle";
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: GeneratedEffectParamOption[];
  description?: string;
};

export type GeneratedEffectDocs = {
  description: string;
  parameters: string;
};

export type EffectIdeaRecord = {
  id: string;
  name: string;
  prompt: string;
  typescriptCode: string;
  runtimeCode: string;
  params?: GeneratedEffectParam[];
  docs?: GeneratedEffectDocs;
  createdAt: number;
};

export type EffectIdeaGenerationResult = {
  name: string;
  typescriptCode: string;
  runtimeCode: string;
  params?: GeneratedEffectParam[];
  docs?: GeneratedEffectDocs;
};

export type EffectIdeaGenerationRequest = {
  improvementAttempt?: number;
};

export type EffectPromptImprovementFailure = {
  promptSent: string;
  response: string;
  error: string;
};

type EffectsResponse = {
  effects?: EffectIdeaRecord[];
  effect?: EffectIdeaRecord;
  pendingEffects?: EffectIdeaRecord[];
  moderationStatus?: "pending";
  reviewUrl?: string | null;
  generation?: EffectIdeaGenerationResult;
  error?: string;
  rawResponse?: string;
  promptTemplate?: {
    version: number;
    template: string;
    updatedAt: string;
    updateSource: "seed" | "self_improvement";
  };
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

type RuntimeSafetyRule = {
  pattern: RegExp;
  reason: string;
  category: "network_access" | "storage_access" | "env_access" | "dynamic_code_exec" | "global_escape";
};

export type RuntimeSafetyViolationCategory = RuntimeSafetyRule["category"];

const RUNTIME_CODE_SAFETY_RULES: RuntimeSafetyRule[] = [
  { pattern: /\bprocess\s*\.\s*env\b/iu, reason: "accessing environment variables (process.env)", category: "env_access" },
  { pattern: /\b(?:globalThis|window)\s*\.\s*process\b/iu, reason: "accessing process globals", category: "env_access" },
  { pattern: /\b(?:Deno|Bun)\s*\.\s*env\b/iu, reason: "accessing runtime environment variables", category: "env_access" },
  { pattern: /\bdocument\s*\.\s*cookie\b/iu, reason: "reading browser cookies", category: "storage_access" },
  { pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/iu, reason: "accessing browser storage", category: "storage_access" },
  { pattern: /\bfetch\s*\(/iu, reason: "making network requests with fetch", category: "network_access" },
  { pattern: /\bXMLHttpRequest\b/iu, reason: "making network requests with XMLHttpRequest", category: "network_access" },
  { pattern: /\bnavigator\s*\.\s*sendBeacon\b/iu, reason: "sending background network beacons", category: "network_access" },
  { pattern: /\bWebSocket\b/iu, reason: "opening network sockets", category: "network_access" },
  { pattern: /\bEventSource\b/iu, reason: "opening server-sent event streams", category: "network_access" }
  ,{ pattern: /\b(?:new\s+Function|eval\s*\(|import\s*\()/iu, reason: "using dynamic code execution primitives", category: "dynamic_code_exec" }
  ,{ pattern: /\b(?:Object|Array|Function)\s*\.\s*prototype\s*\./iu, reason: "mutating shared prototypes", category: "global_escape" }
];

function stripRuntimeStringLiteralsAndComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/\/\/.*$/gmu, " ")
    .replace(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*\1/gu, "\"\"");
}

function normalizeGeneratedCode(rawCode: string): string {
  const hasEscapedNewlines = rawCode.includes("\\n");
  const hasRealNewlines = rawCode.includes("\n");
  const decodedCode = hasEscapedNewlines && !hasRealNewlines
    ? rawCode.replace(/\\n/gu, "\n").replace(/\\r/gu, "\r").replace(/\\t/gu, "\t")
    : rawCode;

  return decodedCode
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

const BLOCKED_GLOBALS = new Set(["eval", "Function", "AsyncFunction", "GeneratorFunction", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "localStorage", "sessionStorage", "indexedDB", "navigator"]);
const BLOCKED_OBJECT_MEMBERS = new Map<string, Set<string>>([
  ["document", new Set(["cookie"])],
  ["navigator", new Set(["sendBeacon"])],
  ["Object", new Set(["setPrototypeOf"])],
  ["Reflect", new Set(["setPrototypeOf", "construct"])]
]);
const BLOCKED_PROTO_MEMBERS = new Set(["__proto__", "prototype"]);
const BLOCKED_IDENTIFIERS = new Set(["process", "global", "globalThis", "window", "self", "Deno", "Bun"]);

function reportSafetyViolation(reason: string): never {
  throw new Error(`Generated runtime code blocked by safety policy: ${reason}.`);
}

export function validateGeneratedRuntimeCode(runtimeCode: string): void {
  const violation = getRuntimeSafetyViolation(runtimeCode);
  if (!violation) {
    return;
  }
  throw new Error(`Generated runtime code blocked by safety policy (${violation.category}): ${violation.reason}.`);
}


export function getRuntimeSafetyViolation(runtimeCode: string): { category: RuntimeSafetyViolationCategory; reason: string } | null {
  const normalizedCode = normalizeGeneratedCode(runtimeCode);
  const codeForValidation = stripRuntimeStringLiteralsAndComments(normalizedCode);
  const violated = RUNTIME_CODE_SAFETY_RULES.find((rule) => rule.pattern.test(codeForValidation));
  if (!violated) return null;
  return { category: violated.category, reason: violated.reason };
  const sourceFile = ts.createSourceFile("generated-effect.ts", normalizedCode, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

  const walk = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && BLOCKED_GLOBALS.has(node.text)) {
      reportSafetyViolation(`using dynamic or network primitive (${node.text})`);
    }
    if (ts.isIdentifier(node) && BLOCKED_IDENTIFIERS.has(node.text)) {
      reportSafetyViolation(`accessing runtime global (${node.text})`);
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "setTimeout") {
      reportSafetyViolation("using async scheduling APIs (setTimeout)");
    }
    if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      reportSafetyViolation("unbounded loop constructs");
    }
    if (ts.isForStatement(node) && !node.condition) {
      reportSafetyViolation("unbounded loop constructs");
    }
    if (ts.isPropertyAccessExpression(node)) {
      const objectName = ts.isIdentifier(node.expression) ? node.expression.text : "";
      if (BLOCKED_OBJECT_MEMBERS.get(objectName)?.has(node.name.text)) {
        reportSafetyViolation(`accessing restricted property (${objectName}.${node.name.text})`);
      }
      if (BLOCKED_PROTO_MEMBERS.has(node.name.text)) {
        reportSafetyViolation(`mutating prototype chain (${node.name.text})`);
      }
    }
    if (ts.isElementAccessExpression(node)) {
      const arg = node.argumentExpression;
      if (arg && ts.isStringLiteralLike(arg) && BLOCKED_PROTO_MEMBERS.has(arg.text)) {
        reportSafetyViolation(`mutating prototype chain (${arg.text})`);
      }
      if (ts.isIdentifier(node.expression) && BLOCKED_IDENTIFIERS.has(node.expression.text)) {
        reportSafetyViolation(`global escape attempt (${node.expression.text})`);
      }
    }
    if (ts.isBinaryExpression(node) && ts.isPropertyAccessExpression(node.left) && BLOCKED_PROTO_MEMBERS.has(node.left.name.text)) {
      reportSafetyViolation(`prototype mutation assignment (${node.left.name.text})`);
    }
    ts.forEachChild(node, walk);
  };

  walk(sourceFile);
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

const DEFAULT_EXECUTION_BUDGET = { maxRenderMs: 12, maxViolations: 3, maxComplexityScore: 40000 };

export function compileRuntimeEffect(runtimeCode: string): Effect {
  const normalizedCode = normalizeGeneratedCode(runtimeCode);
  validateGeneratedRuntimeCode(normalizedCode);
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
  let violations = 0;
  return {
    ...effect,
    render(context) {
      const startedAt = performance.now();
      const score = (context?.width ?? 0) * (context?.height ?? 0);
      if (score > DEFAULT_EXECUTION_BUDGET.maxComplexityScore) {
        violations += 1;
      }
      effect.render(context);
      const elapsed = performance.now() - startedAt;
      if (elapsed > DEFAULT_EXECUTION_BUDGET.maxRenderMs) {
        violations += 1;
      }
      if (violations >= DEFAULT_EXECUTION_BUDGET.maxViolations) {
        throw new Error("Generated runtime code terminated by sandbox kill switch.");
      }
    }
  };
}

export async function generateEffectIdea(prompt: string, options: EffectIdeaGenerationRequest = {}): Promise<EffectIdeaGenerationResult> {
  const payload = await requestEffects("/api/effects?action=generate", {
    method: "POST",
    body: JSON.stringify({
      prompt,
      improvementAttempt: options.improvementAttempt ?? 0
    })
  });
  if (!payload.generation) {
    throw new Error("No generation returned.");
  }
  return payload.generation;
}

export async function improveEffectGenerationPromptTemplate(args: {
  userPrompt: string;
  response: string;
  error: string;
  improvementAttempt: number;
  failureHistory: EffectPromptImprovementFailure[];
}): Promise<void> {
  await requestEffects("/api/effects?action=improvePromptTemplate", {
    method: "POST",
    body: JSON.stringify({
      userPrompt: args.userPrompt,
      response: args.response,
      error: args.error,
      improvementAttempt: args.improvementAttempt,
      failureHistory: args.failureHistory
    })
  });
}

export async function submitEffectIdea(idea: Omit<EffectIdeaRecord, "id" | "createdAt">): Promise<void> {
  await requestEffects("/api/effects", {
    method: "POST",
    body: JSON.stringify(idea)
  });
}

export function buildEffectModerationActionUrl(action: "approve" | "reject", id: string, token: string): string {
  const params = new URLSearchParams({ action, id, token });
  return `/api/effects?${params.toString()}`;
}

export async function fetchPendingEffect(id: string, token: string): Promise<{ effect: EffectIdeaRecord | null; reviewUrl: string | null }> {
  const params = new URLSearchParams({ pendingId: id, token });
  const payload = await requestEffects(`/api/effects?${params.toString()}`, { method: "GET" });
  return {
    effect: isRecord(payload.effect) ? payload.effect : null,
    reviewUrl: payload.reviewUrl ?? null
  };
}

export async function fetchPendingEffects(token: string): Promise<EffectIdeaRecord[]> {
  const params = new URLSearchParams({ includePending: "1", token });
  const payload = await requestEffects(`/api/effects?${params.toString()}`, { method: "GET" });
  return normalizeEffects(payload.pendingEffects);
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
