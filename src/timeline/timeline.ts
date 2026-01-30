import { NormalizedSection, NormalizedTextCue, NormalizedTimeline } from "../config/loadConfig";
import { clamp } from "../util/math";

export type TransitionState = {
  type: "fade" | "wipe";
  progress: number;
  from: NormalizedSection;
  to: NormalizedSection;
};

export type TimelineState = {
  section: NormalizedSection;
  nextSection: NormalizedSection | null;
  transition: TransitionState | null;
  activeCues: NormalizedTextCue[];
};

export function getActiveSectionIndex(time: number, sections: NormalizedSection[]): number {
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    if (time >= sections[i].start) {
      return i;
    }
  }
  return 0;
}

export function getTimelineState(time: number, timeline: NormalizedTimeline): TimelineState {
  const sections = timeline.sections;
  const index = getActiveSectionIndex(time, sections);
  const section = sections[index];
  const nextSection = sections[index + 1] ?? null;

  let transition: TransitionState | null = null;
  if (nextSection) {
    const duration = Math.max(0, section.transition.duration);
    const transitionStart = section.end - duration;
    if (duration > 0 && time >= transitionStart) {
      const progress = clamp((time - transitionStart) / duration, 0, 1);
      transition = {
        type: section.transition.out,
        progress,
        from: section,
        to: nextSection
      };
    }
  }

  const activeCues = timeline.textCues.filter((cue) => time >= cue.start && time <= cue.end);

  return {
    section,
    nextSection,
    transition,
    activeCues
  };
}
