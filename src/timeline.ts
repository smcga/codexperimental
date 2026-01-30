export const STORY_LINES = [
  "Four years ago, in the year 2022…",
  "…artificial intelligence learned to write code…",
  "…it could only achieve modest outcomes…",
  "…but now…",
  "…AI…",
  "…can do THIS…"
];

export const TEXT_VISIBLE_DURATION = 3.2;
export const TEXT_TRANSITION_DURATION = 0.6;
export const TIMELINE_START_DELAY = 2.0;

export type TextWindow = {
  index: number;
  start: number;
  end: number;
};

export const textWindows: TextWindow[] = STORY_LINES.map((_, index) => {
  const start = TIMELINE_START_DELAY + index * (TEXT_VISIBLE_DURATION + TEXT_TRANSITION_DURATION);
  return {
    index,
    start,
    end: start + TEXT_VISIBLE_DURATION
  };
});

export const dropTime = textWindows[5].start + 0.8;

export type EffectWindow = {
  name: string;
  start: number;
  end: number;
};

export const effectWindows: EffectWindow[] = [
  { name: "starfield", start: 0, end: 999 },
  { name: "plasma", start: 0.5, end: textWindows[2].end + 1.5 },
  { name: "tunnel", start: textWindows[2].start + 0.5, end: textWindows[4].end + 1.2 },
  { name: "particles", start: textWindows[4].start, end: 999 },
  { name: "glitch", start: textWindows[3].start, end: 999 }
];

export const getActiveTextIndex = (time: number) => {
  const window = textWindows.find((entry) => time >= entry.start && time <= entry.end);
  return window ? window.index : -1;
};

export const getTextWindow = (time: number) =>
  textWindows.find((entry) => time >= entry.start - TEXT_TRANSITION_DURATION && time <= entry.end + TEXT_TRANSITION_DURATION);

export const getActiveEffects = (time: number) =>
  effectWindows.filter((entry) => time >= entry.start && time <= entry.end).map((entry) => entry.name);

export const totalDuration = dropTime + 12;
