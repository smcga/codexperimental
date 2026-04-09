import { describe, expect, it, vi } from "vitest";

import { generateEffectWithSelfImprovement } from "./effectIdeaSelfImprovement";

describe("generateEffectWithSelfImprovement", () => {
  it("retries when the compiled generated runtime fails, then succeeds on a later attempt", async () => {
    const generate = vi.fn()
      .mockResolvedValueOnce({
        name: "First",
        typescriptCode: "ts",
        runtimeCode: "bad-runtime"
      })
      .mockResolvedValueOnce({
        name: "Second",
        typescriptCode: "ts",
        runtimeCode: "good-runtime"
      });
    const compile = vi.fn((runtimeCode: string) => {
      if (runtimeCode === "bad-runtime") {
        throw new Error("Generated effect is missing a render function.");
      }
      return { render: vi.fn() };
    });

    const phaseMessages: string[] = [];
    const result = await generateEffectWithSelfImprovement({
      maxSelfImprovementFailures: 5,
      generate,
      compile,
      retryDelayMs: 0,
      onPhaseChange: (phase) => phaseMessages.push(phase.message)
    });

    expect(generate).toHaveBeenNthCalledWith(1, 0);
    expect(generate).toHaveBeenNthCalledWith(2, 1);
    expect(phaseMessages).toEqual([
      "Generating effect code with Codex (attempt 1/6)…",
      "An error occurred. Self-improvement protocol engaged. Auto-retry attempt 1/5…"
    ]);
    expect(result.generation.name).toBe("Second");
  });

  it("throws only after all retries are exhausted", async () => {
    const generate = vi.fn(async () => {
      throw new Error("OpenAI request failed (503).");
    });

    await expect(generateEffectWithSelfImprovement({
      maxSelfImprovementFailures: 5,
      generate,
      compile: vi.fn(() => ({ render: vi.fn() })),
      retryDelayMs: 0
    })).rejects.toThrow("OpenAI request failed (503).");
    expect(generate).toHaveBeenCalledTimes(6);
  });
});
