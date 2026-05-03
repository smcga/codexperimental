import type { MobileTransitionDrawContext, TransitionDefinition, TransitionRendererApi } from "./transitions";

export function drawMobileTransitionWithFallback(
  definition: TransitionDefinition,
  api: TransitionRendererApi,
  context: MobileTransitionDrawContext,
  fallback: () => void,
  onError?: (error: unknown) => void
): void {
  if (!definition.drawMobile) {
    fallback();
    return;
  }

  try {
    definition.drawMobile(api, context);
  } catch (error) {
    onError?.(error);
    fallback();
  }
}
