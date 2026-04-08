export function getEffectIdeaCloseBlockedMessage(isGenerating: boolean): string | null {
  if (!isGenerating) {
    return null;
  }
  return "Generation is still running. Keep this panel open so you can track progress.";
}

export function shouldShowCommunityCarouselButtons(
  isGenerating: boolean,
  isBusyModalVisible: boolean,
  entryCount: number
): boolean {
  return (isGenerating || isBusyModalVisible) && entryCount >= 2;
}
