import { clamp } from "./util/math";

const lineTexts = [
  "Four years ago, in the year 2022…",
  "…artificial intelligence learned to write code…",
  "…it could only achieve modest outcomes…",
  "…but now…",
  "…AI…",
  "…can do THIS…"
];

const lineVisibleDuration = 3.2;
const lineTransition = 0.6;
const lineStep = lineVisibleDuration + lineTransition;
const lineStartOffset = 1.0;

export const timelineLines = lineTexts.map((text, index) => {
  const start = lineStartOffset + index * lineStep;
  const end = start + lineVisibleDuration + lineTransition;
  return { text, start, end };
});

export const dropTime = timelineLines[5].start + 0.8;

export const getActiveTextIndex = (time: number) => {
  for (let i = 0; i < timelineLines.length; i += 1) {
    if (time >= timelineLines[i].start && time <= timelineLines[i].end) {
      return i;
    }
  }
  return -1;
};

export const getTextState = (time: number) => {
  const index = getActiveTextIndex(time);
  if (index < 0) {
    return { text: "", alpha: 0, glitch: 0, offset: 0 };
  }
  const line = timelineLines[index];
  const fadeInEnd = line.start + lineTransition;
  const fadeOutStart = line.end - lineTransition;
  const fadeIn = clamp((time - line.start) / lineTransition, 0, 1);
  const fadeOut = clamp((line.end - time) / lineTransition, 0, 1);
  const alpha = Math.min(fadeIn, fadeOut);
  const offset = (1 - alpha) * 20;
  const glitch = index === 5 ? clamp((time - line.start) / 1.2, 0, 1) : 0;
  return { text: line.text, alpha, glitch, offset };
};

export const getEffectState = (time: number) => {
  const introEnd = timelineLines[1].start;
  const plasmaEnd = timelineLines[3].start;
  const tunnelEnd = timelineLines[5].start;
  const preDrop = dropTime - 0.4;

  const starfield = time < tunnelEnd ? 1 : 0.8;
  const plasma = clamp((time - introEnd) / 2, 0, 1) * clamp((plasmaEnd - time) / 2, 0, 1);
  const tunnel = clamp((time - timelineLines[3].start) / 2, 0, 1) *
    clamp((tunnelEnd - time) / 2, 0, 1);
  const particles = time >= dropTime ? 1 : 0;
  const glitch = time >= preDrop ? clamp((time - preDrop) / 1.2, 0, 1) : 0;

  return {
    starfield,
    plasma,
    tunnel,
    particles,
    glitch
  };
};
