export const EFFECT_IDEA_COUNTDOWN_BEATS = 3;
export const EFFECT_IDEA_COUNTDOWN_BPM = 177;
export const EFFECT_IDEA_NAME_MAX_LENGTH = 48;

const EFFECT_NAME_PATTERN = /[^a-z0-9 _-]/giu;

export function getCountdownBeatDurationMs(bpm = EFFECT_IDEA_COUNTDOWN_BPM): number {
  return (60 / bpm) * 1000;
}

export function shuffleEffectIds(ids: string[], random = Math.random): string[] {
  const next = [...ids];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function sanitizeEffectIdeaName(rawValue: string): string {
  return rawValue
    .replace(EFFECT_NAME_PATTERN, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, EFFECT_IDEA_NAME_MAX_LENGTH);
}
