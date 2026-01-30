export type TransitionType = "fade" | "wipe";

export type TransitionConfig = {
  in?: TransitionType;
  out?: TransitionType;
  duration?: number;
};

export type SectionConfig = {
  id: string;
  start: number;
  end?: number;
  effect: string;
  transition?: TransitionConfig;
  params?: Record<string, number>;
};

export type SpanConfig = {
  text: string;
  color?: string;
  size?: number;
  weight?: string;
};

export type TextCueConfig = {
  id: string;
  start: number;
  end?: number;
  text?: string;
  spans?: SpanConfig[];
  x?: number;
  y?: number;
  align?: CanvasTextAlign;
  size?: number;
  color?: string;
  units?: "px" | "norm";
  effects?: {
    glitchIn?: boolean;
    shadow?: boolean;
    scanlineMask?: number;
    typewriter?: { speed: number };
  };
};

export type TimelineConfig = {
  audio: {
    src: string;
    offset?: number;
  };
  sections: SectionConfig[];
  textCues: TextCueConfig[];
};

export type NormalizedSection = Required<SectionConfig> & {
  end: number;
  transition: Required<TransitionConfig>;
  params: Record<string, number>;
};

export type NormalizedTextCue = Required<
  Omit<TextCueConfig, "text" | "spans" | "effects" | "end">
> & {
  end: number;
  text: string;
  spans: SpanConfig[];
  effects: Required<TextCueConfig["effects"]>;
};

export type NormalizedTimelineConfig = {
  audio: {
    src: string;
    offset: number;
  };
  sections: NormalizedSection[];
  textCues: NormalizedTextCue[];
};

const DEFAULT_TRANSITION: Required<TransitionConfig> = {
  in: "fade",
  out: "fade",
  duration: 0.8
};

const DEFAULT_TEXT_EFFECTS: Required<TextCueConfig["effects"]> = {
  glitchIn: false,
  shadow: false,
  scanlineMask: 0,
  typewriter: { speed: 0 }
};

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`Invalid ${label} in timeline config.`);
  }
  return value;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${label} in timeline config.`);
  }
  return value;
}

function normalizeTransition(transition?: TransitionConfig): Required<TransitionConfig> {
  const next = {
    in: transition?.in ?? DEFAULT_TRANSITION.in,
    out: transition?.out ?? DEFAULT_TRANSITION.out,
    duration: transition?.duration ?? DEFAULT_TRANSITION.duration
  };
  if (next.in !== "fade" && next.in !== "wipe") {
    next.in = "fade";
  }
  if (next.out !== "fade" && next.out !== "wipe") {
    next.out = "fade";
  }
  if (next.duration <= 0) {
    next.duration = DEFAULT_TRANSITION.duration;
  }
  return next;
}

function normalizeSpans(cue: TextCueConfig): SpanConfig[] {
  if (cue.spans && cue.spans.length > 0) {
    return cue.spans.map((span) => ({
      text: span.text,
      color: span.color,
      size: span.size,
      weight: span.weight
    }));
  }
  return [{ text: cue.text ?? "" }];
}

function normalizeTextEffects(
  effects?: TextCueConfig["effects"]
): Required<TextCueConfig["effects"]> {
  return {
    glitchIn: effects?.glitchIn ?? DEFAULT_TEXT_EFFECTS.glitchIn,
    shadow: effects?.shadow ?? DEFAULT_TEXT_EFFECTS.shadow,
    scanlineMask: effects?.scanlineMask ?? DEFAULT_TEXT_EFFECTS.scanlineMask,
    typewriter: {
      speed: effects?.typewriter?.speed ?? DEFAULT_TEXT_EFFECTS.typewriter.speed
    }
  };
}

export function normalizeTimelineConfig(raw: TimelineConfig): NormalizedTimelineConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("Timeline config is missing or invalid.");
  }

  const audioSrc = assertString(raw.audio?.src, "audio.src");
  const offset = typeof raw.audio?.offset === "number" ? raw.audio.offset : 0;

  if (!Array.isArray(raw.sections)) {
    throw new Error("Timeline config must include sections.");
  }

  if (raw.sections.length !== 16) {
    throw new Error("Timeline must contain exactly 16 sections.");
  }

  const sections = raw.sections
    .map((section) => ({
      id: assertString(section.id, "section.id"),
      start: assertNumber(section.start, `section.start (${section.id})`),
      end: section.end,
      effect: assertString(section.effect, `section.effect (${section.id})`),
      transition: normalizeTransition(section.transition),
      params: section.params ?? {}
    }))
    .sort((a, b) => a.start - b.start);

  sections.forEach((section, index) => {
    if (index > 0 && section.start < sections[index - 1].start) {
      throw new Error("Sections must be sorted by start time.");
    }
  });

  const normalizedSections: NormalizedSection[] = sections.map((section, index) => {
    const nextStart = sections[index + 1]?.start;
    const end =
      typeof section.end === "number"
        ? section.end
        : typeof nextStart === "number"
          ? nextStart
          : Number.POSITIVE_INFINITY;
    if (end <= section.start) {
      throw new Error(`Section ${section.id} end must be after start.`);
    }
    return {
      ...section,
      end
    };
  });

  const textCues = Array.isArray(raw.textCues) ? raw.textCues : [];
  const normalizedTextCues: NormalizedTextCue[] = textCues.map((cue) => {
    const start = assertNumber(cue.start, `textCues.start (${cue.id})`);
    const end = typeof cue.end === "number" ? cue.end : start + 3.0;
    return {
      id: assertString(cue.id, "textCues.id"),
      start,
      end,
      text: cue.text ?? "",
      spans: normalizeSpans(cue),
      x: typeof cue.x === "number" ? cue.x : 0.5,
      y: typeof cue.y === "number" ? cue.y : 0.5,
      align: cue.align ?? "center",
      size: typeof cue.size === "number" ? cue.size : 42,
      color: cue.color ?? "#ffffff",
      units: cue.units ?? "norm",
      effects: normalizeTextEffects(cue.effects)
    };
  });

  return {
    audio: {
      src: audioSrc,
      offset
    },
    sections: normalizedSections,
    textCues: normalizedTextCues
  };
}

export async function loadTimelineConfig(path = "/timeline.json"): Promise<NormalizedTimelineConfig> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load timeline config (${response.status}).`);
  }
  const raw = (await response.json()) as TimelineConfig;
  return normalizeTimelineConfig(raw);
}
