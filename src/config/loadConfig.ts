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
  params?: Record<string, unknown>;
};

export type TextSpanConfig = {
  text: string;
  color?: string;
};

export type TextEffectsConfig = {
  glitchIn?: boolean;
  shadow?: boolean;
  scanlineMask?: number;
  typewriter?: { speed: number };
};

export type TextCueConfig = {
  id: string;
  start: number;
  end?: number;
  text?: string;
  spans?: TextSpanConfig[];
  x?: number;
  y?: number;
  units?: "px";
  align?: CanvasTextAlign;
  size?: number;
  color?: string;
  effects?: TextEffectsConfig;
};

export type TimelineConfig = {
  audio: { src: string; offset: number };
  sections: SectionConfig[];
  textCues: TextCueConfig[];
};

const DEFAULT_TEXT_COLOR = "#ffffff";
const DEFAULT_TEXT_SIZE = 42;
const DEFAULT_ALIGN: CanvasTextAlign = "center";
const DEFAULT_TRANSITION_DURATION = 0.8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function readNumber(value: unknown, name: string): number {
  assert(typeof value === "number" && Number.isFinite(value), `Expected ${name} to be a number`);
  return value;
}

function readString(value: unknown, name: string): string {
  assert(typeof value === "string" && value.trim().length > 0, `Expected ${name} to be a string`);
  return value;
}

function parseTransition(value: unknown): TransitionConfig {
  if (!isRecord(value)) {
    return { in: "fade", out: "fade", duration: DEFAULT_TRANSITION_DURATION };
  }

  const typeIn = value.in;
  const typeOut = value.out;
  const duration = value.duration;
  const parsed: TransitionConfig = {
    in: typeIn === "wipe" ? "wipe" : "fade",
    out: typeOut === "wipe" ? "wipe" : "fade",
    duration:
      typeof duration === "number" && Number.isFinite(duration) && duration > 0
        ? duration
        : DEFAULT_TRANSITION_DURATION
  };

  return parsed;
}

function parseSection(raw: unknown): SectionConfig {
  assert(isRecord(raw), "Section entry must be an object");
  const id = readString(raw.id, "section.id");
  const start = readNumber(raw.start, `section ${id} start`);
  const effect = readString(raw.effect, `section ${id} effect`);
  const end = raw.end;
  const params = isRecord(raw.params) ? raw.params : undefined;
  const transition = parseTransition(raw.transition);
  return {
    id,
    start,
    end: typeof end === "number" && Number.isFinite(end) ? end : undefined,
    effect,
    transition,
    params
  };
}

function parseTextCue(raw: unknown): TextCueConfig {
  assert(isRecord(raw), "Text cue entry must be an object");
  const id = readString(raw.id, "textCues.id");
  const start = readNumber(raw.start, `text cue ${id} start`);
  const end = raw.end;
  const text = typeof raw.text === "string" ? raw.text : undefined;
  const spans = Array.isArray(raw.spans)
    ? raw.spans.map((span, index) => {
        assert(isRecord(span), `text cue ${id} span ${index} must be an object`);
        return {
          text: readString(span.text, `text cue ${id} span ${index} text`),
          color: typeof span.color === "string" ? span.color : undefined
        };
      })
    : undefined;

  assert(text || (spans && spans.length > 0), `text cue ${id} must have text or spans`);

  const x = typeof raw.x === "number" ? raw.x : 0.5;
  const y = typeof raw.y === "number" ? raw.y : 0.5;
  const align =
    raw.align === "left" || raw.align === "right" || raw.align === "center"
      ? raw.align
      : DEFAULT_ALIGN;
  const size = typeof raw.size === "number" && raw.size > 0 ? raw.size : DEFAULT_TEXT_SIZE;
  const color = typeof raw.color === "string" ? raw.color : DEFAULT_TEXT_COLOR;
  const units = raw.units === "px" ? "px" : undefined;
  const effects = isRecord(raw.effects) ? raw.effects : undefined;

  return {
    id,
    start,
    end: typeof end === "number" && Number.isFinite(end) ? end : undefined,
    text,
    spans,
    x,
    y,
    units,
    align,
    size,
    color,
    effects: effects as TextEffectsConfig | undefined
  };
}

export function parseTimelineConfig(raw: unknown): TimelineConfig {
  assert(isRecord(raw), "Timeline config must be an object");
  assert(isRecord(raw.audio), "Timeline config audio must be an object");

  const audioSrc = readString(raw.audio.src, "audio.src");
  const audioOffset =
    typeof raw.audio.offset === "number" && Number.isFinite(raw.audio.offset)
      ? raw.audio.offset
      : 0;

  assert(Array.isArray(raw.sections), "Timeline config sections must be an array");
  const sections = raw.sections.map(parseSection);
  assert(sections.length === 16, "Timeline must contain exactly 16 sections");

  const sortedSections = [...sections].sort((a, b) => a.start - b.start);
  sortedSections.forEach((section, index) => {
    assert(section.start >= 0, `section ${section.id} start must be >= 0`);
    if (section.end !== undefined) {
      assert(section.end > section.start, `section ${section.id} end must be > start`);
    }
    if (index > 0) {
      assert(
        section.start >= sortedSections[index - 1].start,
        "Sections must be sorted by start time"
      );
    }
  });

  const normalizedSections = sortedSections.map((section, index) => {
    const next = sortedSections[index + 1];
    const end =
      section.end !== undefined
        ? section.end
        : next
          ? next.start
          : undefined;
    if (end !== undefined) {
      assert(end > section.start, `section ${section.id} end must be > start`);
    }
    return {
      ...section,
      end
    };
  });

  const textCues = Array.isArray(raw.textCues) ? raw.textCues.map(parseTextCue) : [];
  const normalizedCues = textCues.map((cue) => ({
    ...cue,
    end: cue.end ?? cue.start + 3
  }));

  return {
    audio: { src: audioSrc, offset: audioOffset },
    sections: normalizedSections,
    textCues: normalizedCues
  };
}

export async function loadTimelineConfig(): Promise<TimelineConfig> {
  const response = await fetch("/timeline.json");
  if (!response.ok) {
    throw new Error(`Failed to load timeline config (${response.status})`);
  }
  const raw = (await response.json()) as unknown;
  return parseTimelineConfig(raw);
}
