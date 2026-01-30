import { TimelineConfig, SectionConfig, TextCue } from "../config/loadConfig";
import { clamp } from "../util/math";

export type TimelineState = {
  section: SectionConfig;
  transition?: {
    from: SectionConfig;
    to: SectionConfig;
    progress: number;
    type: "fade" | "wipe";
  };
  activeTextCues: TextCue[];
};

export class Timeline {
  private sections: SectionConfig[];
  private textCues: TextCue[];
  private audioOffset: number;
  private duration = 0;

  constructor(private config: TimelineConfig) {
    this.sections = [...config.sections];
    this.textCues = config.textCues;
    this.audioOffset = config.audio.offset;
  }

  setAudioDuration(duration: number): void {
    this.duration = duration;
    const last = this.sections[this.sections.length - 1];
    if (last && last.endFromAudio) {
      last.end = duration;
      last.endFromAudio = false;
    }
  }

  getAudioOffset(): number {
    return this.audioOffset;
  }

  getState(time: number): TimelineState {
    const sectionIndex = this.findSectionIndex(time);
    const section = this.sections[sectionIndex];
    const prevSection = sectionIndex > 0 ? this.sections[sectionIndex - 1] : null;
    const transition = this.getTransition(section, prevSection, time);
    const activeTextCues = this.textCues.filter((cue) => time >= cue.start && time <= cue.end);

    return {
      section,
      transition,
      activeTextCues
    };
  }

  private findSectionIndex(time: number): number {
    for (let i = this.sections.length - 1; i >= 0; i -= 1) {
      if (time >= this.sections[i].start) {
        return i;
      }
    }
    return 0;
  }

  private getTransition(
    section: SectionConfig,
    prevSection: SectionConfig | null,
    time: number
  ): TimelineState["transition"] {
    if (!prevSection) {
      return undefined;
    }
    const duration = section.transition.duration;
    if (duration <= 0) {
      return undefined;
    }
    const progress = clamp((time - section.start) / duration, 0, 1);
    if (progress <= 0 || progress >= 1) {
      return undefined;
    }
    const type = section.transition.in ?? prevSection.transition.out;
    return {
      from: prevSection,
      to: section,
      progress,
      type
    };
  }

  getDurationFallback(): number {
    return this.duration || (this.sections[this.sections.length - 1]?.end ?? 0);
  }
}
