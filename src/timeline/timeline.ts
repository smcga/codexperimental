import type { SectionConfig, TextCueConfig, TransitionType } from "../config/loadConfig";
import { clamp } from "../util/math";

export type SectionState = {
  section: SectionConfig;
  transition?: {
    from: SectionConfig;
    to: SectionConfig;
    progress: number;
    duration: number;
    type: TransitionType;
  };
};

const DEFAULT_TRANSITION_DURATION = 0.8;

export function getSectionState(
  time: number,
  sections: SectionConfig[],
  audioDuration = 0
): SectionState {
  if (sections.length === 0) {
    throw new Error("No sections available");
  }

  let index = 0;
  for (let i = 0; i < sections.length; i += 1) {
    if (time >= sections[i].start) {
      index = i;
    } else {
      break;
    }
  }

  const section = sections[index];
  const resolvedEnd =
    section.end ?? (index === sections.length - 1 ? audioDuration : undefined);
  if (resolvedEnd !== undefined && time > resolvedEnd && index < sections.length - 1) {
    const nextSection = sections[index + 1];
    return { section: nextSection };
  }

  if (index > 0) {
    const previous = sections[index - 1];
    const transitionDuration =
      section.transition?.duration ?? previous.transition?.duration ?? DEFAULT_TRANSITION_DURATION;
    if (transitionDuration > 0 && time < section.start + transitionDuration) {
      const progress = clamp((time - section.start) / transitionDuration, 0, 1);
      const type = section.transition?.in ?? "fade";
      return {
        section,
        transition: {
          from: previous,
          to: section,
          progress,
          duration: transitionDuration,
          type
        }
      };
    }
  }

  return { section };
}

export function getActiveTextCues(time: number, cues: TextCueConfig[]): TextCueConfig[] {
  return cues.filter((cue) => time >= cue.start && time <= (cue.end ?? cue.start + 3));
}
