export function getEffectIdeaCloseBlockedMessage(isGenerating: boolean): string | null {
  if (!isGenerating) {
    return null;
  }
  return "Generation is still running. Keep this panel open so you can track progress.";
}
