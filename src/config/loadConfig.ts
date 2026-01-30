export type TimelineAudioConfig = {
  src: string;
  offset?: number;
};

export type SectionTransitionConfig = {
  in?: "fade" | "wipe";
  out?: "fade" | "wipe";
  duration?: number;
};

export type SectionConfig = {
  id: string;
  start: number;
  end?: number;
  effect: string;
  transition?: SectionTransitionConfig;
  params?: Record<string, number>;
};

export type TextSpanConfig = {
  text: string;
  color?: string;
};

export type TypewriterConfig = {
  speed: number;
};

export type TextCueEffectsConfig = {
  glitchIn?: boolean;
  shadow?: boolean;
  scanlineMask?: number;
  typewriter?: TypewriterConfig;
};

export type TextCueConfig = {
  id: string;
  start: number;
  end?: number;
  text?: string;
  spans?: TextSpanConfig[];
  x?: number;
  y?: number;
  units?: "px" | "normalized";
  align?: CanvasTextAlign;
  size?: number;
  color?: string;
  effects?: TextCueEffectsConfig;
};

export type TimelineConfig = {
  audio: TimelineAudioConfig;
  sections: SectionConfig[];
  textCues?: TextCueConfig[];
};

export type NormalizedSection = Required<SectionConfig> & {
  transition: Required<SectionTransitionConfig>;
};

export type NormalizedTextSpan = Required<TextSpanConfig>;

export type NormalizedTextCue = Required<Omit<TextCueConfig, "text" | "spans" | "effects">> & {
  text: string | null;
  spans: NormalizedTextSpan[];
  effects: Required<TextCueEffectsConfig> & { typewriter: TypewriterConfig | null };
};

export type NormalizedTimeline = {
  audio: Required<TimelineAudioConfig>;
  sections: NormalizedSection[];
  textCues: NormalizedTextCue[];
};

const DEFAULT_TEXT_DURATION = 3.0;
const DEFAULT_TEXT_SIZE = 36;
const DEFAULT_TEXT_ALIGN: CanvasTextAlign = "center";
const DEFAULT_TRANSITION_DURATION = 0.8;
const DEFAULT_SECTION_DURATION = 6;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

function requireNumber(value: unknown, label: string): number {
  if (!isNumber(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

export async function fetchTimelineConfig(url: string): Promise<TimelineConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to load timeline config (${response.status}).`);
  }
  const json = (await response.json()) as TimelineConfig;
  return json;
}

export function normalizeTimelineConfig(
  raw: TimelineConfig,
  audioDuration?: number
): NormalizedTimeline {
  if (!raw || typeof raw !== "object") {
    throw new Error("Timeline config missing or invalid.");
  }

  if (!raw.audio || typeof raw.audio !== "object") {
    throw new Error("Timeline audio configuration missing.");
  }

  const audioSrc = requireString(raw.audio.src, "audio.src");
  const audioOffset = isNumber(raw.audio.offset) ? raw.audio.offset : 0;

  if (!Array.isArray(raw.sections)) {
    throw new Error("Timeline sections missing.");
  }

  if (raw.sections.length !== 16) {
    throw new Error("Timeline must contain exactly 16 sections.");
  }

  const sortedSections = [...raw.sections].sort((a, b) => a.start - b.start);

  const normalizedSections = sortedSections.map((section, index) => {
    if (!section) {
      throw new Error("Timeline section entry missing.");
    }
    const id = requireString(section.id, "section.id");
    const start = requireNumber(section.start, `section.start (${id})`);
    const effect = requireString(section.effect, `section.effect (${id})`);

    const transition: Required<SectionTransitionConfig> = {
      in: section.transition?.in ?? "fade",
      out: section.transition?.out ?? "fade",
      duration: isNumber(section.transition?.duration)
        ? section.transition?.duration
        : DEFAULT_TRANSITION_DURATION
    };

    const next = sortedSections[index + 1];
    let end = isNumber(section.end)
      ? section.end
      : next
      ? next.start
      : isNumber(audioDuration)
      ? audioDuration
      : start + DEFAULT_SECTION_DURATION;

    if (end <= start) {
      throw new Error(`Section ${id} has an invalid end time.`);
    }

    return {
      id,
      start,
      end,
      effect,
      transition,
      params: section.params ?? {}
    };
  });

  const ids = new Set<string>();
  normalizedSections.forEach((section) => {
    if (section.start < 0) {
      throw new Error(`Section ${section.id} starts before 0.`);
    }
    if (ids.has(section.id)) {
      throw new Error(`Duplicate section id: ${section.id}.`);
    }
    ids.add(section.id);
  });

  const textCuesRaw = Array.isArray(raw.textCues) ? raw.textCues : [];
  const normalizedTextCues = textCuesRaw.map((cue) => {
    if (!cue) {
      throw new Error("Text cue entry missing.");
    }
    const id = requireString(cue.id, "textCues.id");
    const start = requireNumber(cue.start, `textCues.start (${id})`);
    const end = isNumber(cue.end) ? cue.end : start + DEFAULT_TEXT_DURATION;
    if (end <= start) {
      throw new Error(`Text cue ${id} has an invalid end time.`);
    }

    const spans = Array.isArray(cue.spans) ? cue.spans : [];
    const textValue = typeof cue.text === "string" ? cue.text : null;
    if (spans.length === 0 && !textValue) {
      throw new Error(`Text cue ${id} must have text or spans.`);
    }

    const normalizedSpans = spans.map((span) => ({
      text: requireString(span.text, `textCues.spans.text (${id})`),
      color: span.color ?? cue.color ?? "#ffffff"
    }));

    if (normalizedSpans.length === 0 && textValue) {
      normalizedSpans.push({
        text: textValue,
        color: cue.color ?? "#ffffff"
      });
    }

    return {
      id,
      start,
      end,
      text: textValue,
      spans: normalizedSpans,
      x: isNumber(cue.x) ? cue.x : 0.5,
      y: isNumber(cue.y) ? cue.y : 0.5,
      units: cue.units ?? "normalized",
      align: (cue.align as CanvasTextAlign) ?? DEFAULT_TEXT_ALIGN,
      size: isNumber(cue.size) ? cue.size : DEFAULT_TEXT_SIZE,
      color: cue.color ?? "#ffffff",
      effects: {
        glitchIn: cue.effects?.glitchIn ?? false,
        shadow: cue.effects?.shadow ?? false,
        scanlineMask: isNumber(cue.effects?.scanlineMask) ? cue.effects?.scanlineMask : 0,
        typewriter: cue.effects?.typewriter ?? null
      }
    };
  });

  return {
    audio: {
      src: audioSrc,
      offset: audioOffset
    },
    sections: normalizedSections,
    textCues: normalizedTextCues
  };
}
