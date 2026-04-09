import { EffectIdeaGenerationResult } from "./effectIdeas";
import { Effect } from "./renderer/effects/types";

export type EffectIdeaRetryPhase = {
  attempt: number;
  maxAttempts: number;
  message: string;
};

export type GenerateEffectAttempt = (improvementAttempt: number) => Promise<EffectIdeaGenerationResult>;

export type CompileGeneratedEffect = (runtimeCode: string) => Effect;

export type EffectIdeaFailureContext = {
  improvementAttempt: number;
  maxSelfImprovementFailures: number;
  error: unknown;
  generation?: EffectIdeaGenerationResult;
};

export async function generateEffectWithSelfImprovement(options: {
  maxSelfImprovementFailures: number;
  generate: GenerateEffectAttempt;
  compile: CompileGeneratedEffect;
  onFailure?: (context: EffectIdeaFailureContext) => Promise<void> | void;
  onPhaseChange?: (phase: EffectIdeaRetryPhase) => void;
  retryDelayMs?: number;
}): Promise<{ generation: EffectIdeaGenerationResult; compiledEffect: Effect }> {
  const maxFailures = Math.max(0, Math.floor(options.maxSelfImprovementFailures));
  const maxAttempts = maxFailures + 1;
  const retryDelayMs = options.retryDelayMs ?? 800;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const phaseMessage = attempt === 1
      ? `Generating effect code with Codex (attempt ${attempt}/${maxAttempts})…`
      : `An error occurred. Self-improvement protocol engaged. Auto-retry attempt ${attempt - 1}/${maxFailures}…`;
    options.onPhaseChange?.({
      attempt,
      maxAttempts,
      message: phaseMessage
    });
    let latestGeneration: EffectIdeaGenerationResult | undefined;
    try {
      const generation = await options.generate(attempt - 1);
      latestGeneration = generation;
      const compiledEffect = options.compile(generation.runtimeCode);
      return { generation, compiledEffect };
    } catch (error) {
      lastError = error;
      if (attempt <= maxFailures) {
        await options.onFailure?.({
          improvementAttempt: attempt,
          maxSelfImprovementFailures: maxFailures,
          error,
          generation: latestGeneration
        });
      }
      if (attempt >= maxAttempts) {
        break;
      }
      await new Promise<void>((resolve) => {
        globalThis.setTimeout(resolve, retryDelayMs);
      });
    }
  }

  throw (lastError ?? new Error("Generation failed."));
}
