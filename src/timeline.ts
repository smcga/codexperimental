export const textLines = [
  'Four years ago, in the year 2022…',
  '…artificial intelligence learned to write code…',
  '…it could only achieve modest outcomes…',
  '…but now…',
  '…AI…',
  '…can do THIS…'
];

export const lineDuration = 3.2;
export const transitionDuration = 0.6;
export const introOffset = 1.0;

export const lineStarts = textLines.map((_, index) =>
  introOffset + index * (lineDuration + transitionDuration)
);

export const lineEnds = lineStarts.map((start) => start + lineDuration);

export const demoLength = lineEnds[lineEnds.length - 1] + 6;

export const dropTime = lineStarts[5] + 0.8;

export type EffectName =
  | 'starfield'
  | 'plasma'
  | 'tunnel'
  | 'particles'
  | 'glitch';

export interface EffectWindow {
  name: EffectName;
  start: number;
  end: number;
}

export const effectWindows: EffectWindow[] = [
  { name: 'starfield', start: 0, end: demoLength },
  { name: 'plasma', start: 2.5, end: 11.5 },
  { name: 'tunnel', start: 12.5, end: 24 },
  { name: 'particles', start: dropTime - 0.5, end: demoLength },
  { name: 'glitch', start: lineStarts[4], end: demoLength }
];

export const getActiveTextIndex = (time: number) => {
  const index = lineStarts.findIndex(
    (start, idx) => time >= start && time <= lineEnds[idx]
  );
  return index;
};

export const getTextProgress = (time: number) => {
  const index = getActiveTextIndex(time);
  if (index === -1) {
    return null;
  }
  const start = lineStarts[index];
  const end = lineEnds[index];
  const inTime = Math.min(1, Math.max(0, (time - start) / transitionDuration));
  const outTime = Math.min(1, Math.max(0, (end - time) / transitionDuration));
  return {
    index,
    inProgress: inTime,
    outProgress: outTime
  };
};

export const getEffectsAtTime = (time: number) =>
  effectWindows.filter((effect) => time >= effect.start && time <= effect.end);

export const getSection = (time: number) => {
  if (time >= dropTime) {
    return 'drop';
  }
  if (time >= lineStarts[2]) {
    return 'build';
  }
  return 'intro';
};
