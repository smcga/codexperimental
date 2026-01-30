export const STORY_LINES = [
  "Four years ago, in the year 2022…",
  "…artificial intelligence learned to write code…",
  "…it could only achieve modest outcomes…",
  "…but now…",
  "…AI…",
  "…can do THIS…"
];

export const LINE_DURATION = 3.2;
export const TRANSITION_DURATION = 0.6;
export const LINE_INTERVAL = LINE_DURATION + TRANSITION_DURATION;

export const lineStarts = STORY_LINES.map((_, index) => index * LINE_INTERVAL);

export const lineEnds = lineStarts.map((start) => start + LINE_DURATION);

export const dropTime = lineStarts[5] + 0.8;

export const totalDuration = dropTime + 18;

export type EffectName = "plasma" | "tunnel" | "roto" | "particles";

export const effectWindows: Array<{ name: EffectName; start: number; end: number }> = [
  { name: "plasma", start: 0, end: 12 },
  { name: "tunnel", start: 9, end: 24 },
  { name: "roto", start: 18, end: 34 },
  { name: "particles", start: 16, end: totalDuration }
];

export const textFade = 0.5;

export function getActiveLineIndex(time: number): number {
  for (let i = STORY_LINES.length - 1; i >= 0; i -= 1) {
    if (time >= lineStarts[i]) {
      return i;
    }
  }
  return 0;
}

export function getTextState(time: number): {
  index: number;
  opacity: number;
  yOffset: number;
  glitch: number;
} {
  const index = getActiveLineIndex(time);
  const start = lineStarts[index];
  const end = lineEnds[index];
  const fadeIn = Math.min(1, Math.max(0, (time - start) / textFade));
  const fadeOut = Math.min(1, Math.max(0, (end - time) / textFade));
  const opacity = Math.min(fadeIn, fadeOut);
  const yOffset = (1 - fadeIn) * 24 - (1 - fadeOut) * 10;
  const glitch = Math.max(0, 1 - fadeIn) + Math.max(0, 1 - fadeOut);
  return { index, opacity, yOffset, glitch };
}

export function getEffectMix(time: number): Record<EffectName, number> {
  const mix: Record<EffectName, number> = {
    plasma: 0,
    tunnel: 0,
    roto: 0,
    particles: 0
  };
  effectWindows.forEach((window) => {
    if (time < window.start || time > window.end) {
      return;
    }
    const fade = 1;
    const progress = (time - window.start) / (window.end - window.start);
    const ease = progress < 0.1 ? progress / 0.1 : progress > 0.9 ? (1 - progress) / 0.1 : fade;
    mix[window.name] = Math.max(0, Math.min(1, ease));
  });
  return mix;
}

export function getDropIntensity(time: number): number {
  if (time < dropTime) {
    return 0;
  }
  return Math.min(1, (time - dropTime) / 2);
}
