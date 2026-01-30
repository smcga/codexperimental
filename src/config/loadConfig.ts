export type TransitionType = "fade" | "wipe";

export type RawAudioConfig = {
  src: string;
  offset?: number;
};

export type RawSectionConfig = {
  id: string;
  start: number | string;
  end?: number | string;
  effect: string;
  transition?: {
    in?: TransitionType;
    out?: TransitionType;
    duration?: number;
  };
  params?: Record<string, number>;
};

export type RawTextSpan = {
  text: string;
  color?: string;
  size?: number;
  weight?: string;
  font?: string;
};

export type RawTextCue = {
  id: string;
  start: number | string;
  end?: number | string;
  text?: string;
  spans?: RawTextSpan[];
  x?: number;
  y?: number;
  align?: "left" | "center" | "right";
  size?: number;
  color?: string;
  units?: "px";
  effects?: {
    glitchIn?: boolean;
    shadow?: boolean;
    scanlineMask?: number;
    typewriter?: {
      speed: number;
    };
  };
};

export type RawTimelineConfig = {
  audio: RawAudioConfig;
  sections: RawSectionConfig[];
  textCues?: RawTextCue[];
};

export type TransitionConfig = {
  in: TransitionType;
  out: TransitionType;
  duration: number;
};

export type SectionConfig = {
  id: string;
  start: number;
  end: number | null;
  effect: string;
  transition: TransitionConfig;
  params: Record<string, number>;
  endFromAudio: boolean;
};

export type TextSpan = RawTextSpan & { size: number; color: string; weight: string; font: string };

export type TextCue = {
  id: string;
  start: number;
  end: number;
  spans: TextSpan[];
  text?: string;
  x: number;
  y: number;
  align: "left" | "center" | "right";
  size: number;
  color: string;
  units: "px" | "normalized";
  effects: {
    glitchIn: boolean;
    shadow: boolean;
    scanlineMask: number;
    typewriter?: {
      speed: number;
    };
  };
};

export type TimelineConfig = {
  audio: {
    src: string;
    offset: number;
  };
  sections: SectionConfig[];
  textCues: TextCue[];
};

const DEFAULT_TRANSITION: TransitionConfig = {
  in: "fade",
  out: "fade",
  duration: 0.8
};

const DEFAULT_TEXT_SIZE = 42;
const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_TEXT_ALIGN: "left" | "center" | "right" = "center";
const DEFAULT_TEXT_X = 0.5;
const DEFAULT_TEXT_Y = 0.7;
const DEFAULT_CUE_DURATION = 3.0;

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number`);
  }
  return value;
}

function parseTimelineTime(value: number | string, label: string): number {
  if (typeof value === "number") {
    return assertNumber(value, label);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{2}):(\d{2})(?:\.(\d+))?$/);
    if (!match) {
      throw new Error(`${label} must be in mm:ss or mm:ss.s format`);
    }
    const minutes = Number(match[1]);
    const seconds = Number(match[2] + (match[3] ? `.${match[3]}` : ""));
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
      throw new Error(`${label} must be in mm:ss or mm:ss.s format`);
    }
    if (seconds >= 60) {
      throw new Error(`${label} must have seconds less than 60`);
    }
    return minutes * 60 + seconds;
  }
  throw new Error(`${label} must be a number or time string`);
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function normalizeTransition(transition?: RawSectionConfig["transition"]): TransitionConfig {
  const incoming = transition?.in ?? DEFAULT_TRANSITION.in;
  const outgoing = transition?.out ?? DEFAULT_TRANSITION.out;
  const duration = transition?.duration ?? DEFAULT_TRANSITION.duration;
  if (incoming !== "fade" && incoming !== "wipe") {
    throw new Error(`transition.in must be "fade" or "wipe"`);
  }
  if (outgoing !== "fade" && outgoing !== "wipe") {
    throw new Error(`transition.out must be "fade" or "wipe"`);
  }
  if (duration <= 0) {
    throw new Error("transition.duration must be positive");
  }
  return { in: incoming, out: outgoing, duration };
}

function normalizeTextSpans(cue: RawTextCue): TextSpan[] {
  if (cue.spans && cue.spans.length > 0) {
    return cue.spans.map((span) => {
      return {
        text: assertString(span.text, `textCues.${cue.id}.spans.text`),
        color: span.color ?? cue.color ?? DEFAULT_TEXT_COLOR,
        size: span.size ?? cue.size ?? DEFAULT_TEXT_SIZE,
        weight: span.weight ?? "bold",
        font: span.font ?? "Courier New"
      };
    });
  }
  if (cue.text) {
    return [
      {
        text: assertString(cue.text, `textCues.${cue.id}.text`),
        color: cue.color ?? DEFAULT_TEXT_COLOR,
        size: cue.size ?? DEFAULT_TEXT_SIZE,
        weight: "bold",
        font: "Courier New"
      }
    ];
  }
  throw new Error(`textCue ${cue.id} must include text or spans`);
}

export function normalizeTimelineConfig(raw: RawTimelineConfig): TimelineConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("Timeline config must be an object");
  }
  const audio = raw.audio ?? ({} as RawAudioConfig);
  const audioSrc = assertString(audio.src, "audio.src");
  const audioOffset = audio.offset ?? 0;
  assertNumber(audioOffset, "audio.offset");

  if (!Array.isArray(raw.sections)) {
    throw new Error("sections must be an array");
  }
  if (raw.sections.length !== 16) {
    throw new Error("Exactly 16 sections are required");
  }

  const sections = raw.sections.map((section, index) => {
    const start = parseTimelineTime(section.start, `sections[${index}].start`);
    const end =
      section.end !== undefined ? parseTimelineTime(section.end, `sections[${index}].end`) : null;
    if (end !== null && end <= start) {
      throw new Error(`sections[${index}].end must be greater than start`);
    }
    return {
      id: assertString(section.id, `sections[${index}].id`),
      start,
      end,
      effect: assertString(section.effect, `sections[${index}].effect`),
      transition: normalizeTransition(section.transition),
      params: section.params ?? {},
      endFromAudio: end === null
    };
  });

  sections.sort((a, b) => a.start - b.start);
  for (let i = 1; i < sections.length; i += 1) {
    if (sections[i].start === sections[i - 1].start) {
      throw new Error("Section start times must be unique");
    }
  }

  sections.forEach((section, index) => {
    if (section.start < 0) {
      throw new Error(`sections[${index}].start must be >= 0`);
    }
    if (section.end === null && index < sections.length - 1) {
      const nextStart = sections[index + 1].start;
      if (nextStart <= section.start) {
        throw new Error("Section start times must be ascending");
      }
      section.end = nextStart;
      section.endFromAudio = false;
    }
  });

  const textCues = (raw.textCues ?? []).map((cue, index) => {
    const start = parseTimelineTime(cue.start, `textCues[${index}].start`);
    const end =
      cue.end !== undefined
        ? parseTimelineTime(cue.end, `textCues[${index}].end`)
        : start + DEFAULT_CUE_DURATION;
    if (end <= start) {
      throw new Error(`textCues[${index}].end must be greater than start`);
    }
    const spans = normalizeTextSpans(cue);
    return {
      id: assertString(cue.id, `textCues[${index}].id`),
      start,
      end,
      spans,
      text: cue.text,
      x: cue.x ?? DEFAULT_TEXT_X,
      y: cue.y ?? DEFAULT_TEXT_Y,
      align: cue.align ?? DEFAULT_TEXT_ALIGN,
      size: cue.size ?? DEFAULT_TEXT_SIZE,
      color: cue.color ?? DEFAULT_TEXT_COLOR,
      units: cue.units === "px" ? "px" : "normalized",
      effects: {
        glitchIn: cue.effects?.glitchIn ?? false,
        shadow: cue.effects?.shadow ?? false,
        scanlineMask: cue.effects?.scanlineMask ?? 0,
        typewriter: cue.effects?.typewriter
      }
    };
  });

  return {
    audio: {
      src: audioSrc,
      offset: audioOffset
    },
    sections,
    textCues
  };
}

export async function loadConfig(path = "/timeline.json"): Promise<TimelineConfig> {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load timeline config (${response.status})`);
  }
  const raw = (await response.json()) as RawTimelineConfig;
  return normalizeTimelineConfig(raw);
}
