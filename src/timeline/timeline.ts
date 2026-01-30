import type { NormalizedSection, NormalizedTextCue, NormalizedTimelineConfig } from "../config/loadConfig";

export type TransitionState = {
  from: NormalizedSection;
  to: NormalizedSection;
  progress: number;
  type: "fade" | "wipe";
};

export type TimelineState = {
  current: NormalizedSection;
  next?: NormalizedSection;
  transition?: TransitionState;
  cues: NormalizedTextCue[];
};

export class Timeline {
  private sections: NormalizedSection[];
  private textCues: NormalizedTextCue[];

  constructor(sections: NormalizedSection[], textCues: NormalizedTextCue[]) {
    this.sections = sections;
    this.textCues = textCues;
  }

  getState(time: number): TimelineState {
    const currentIndex = this.getSectionIndex(time);
    const current = this.sections[currentIndex];
    const next = this.sections[currentIndex + 1];
    const transition = this.getTransition(time, current, next);
    const cues = this.textCues.filter((cue) => time >= cue.start && time <= cue.end);

    return {
      current,
      next,
      transition,
      cues
    };
  }

  private getSectionIndex(time: number): number {
    for (let i = this.sections.length - 1; i >= 0; i -= 1) {
      if (time >= this.sections[i].start) {
        return i;
      }
    }
    return 0;
  }

  private getTransition(
    time: number,
    current: NormalizedSection,
    next?: NormalizedSection
  ): TransitionState | undefined {
    if (!next) {
      return undefined;
    }
    const duration = current.transition.duration;
    const boundary = current.end;
    const start = boundary - duration;
    if (time < start || time > boundary) {
      return undefined;
    }
    const progress = Math.min(1, Math.max(0, (time - start) / duration));
    return {
      from: current,
      to: next,
      progress,
      type: current.transition.out
    };
  }
}

export function createTimeline(
  config: NormalizedTimelineConfig,
  audioDuration: number
): Timeline {
  const sections = config.sections.map((section, index) => {
    if (section.end !== Number.POSITIVE_INFINITY) {
      return section;
    }
    const fallbackEnd = audioDuration > 0 ? audioDuration : section.start + 8;
    const nextStart = config.sections[index + 1]?.start;
    return {
      ...section,
      end: typeof nextStart === "number" ? nextStart : fallbackEnd
    };
  });

  return new Timeline(sections, config.textCues);
}
