import { EaseName, ParamAutomation } from "../timeline/automation";

const TRANSITION_TYPES = [
  "fade",
  "wipe",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "iris",
  "flash",
  "shatter",
  "signal-collapse",
  "camera-punch-through",
  "bitplane-wipe",
  "packet-loss"
] as const;

export type TransitionType = (typeof TRANSITION_TYPES)[number];

const ERA_PRESETS = ["8bit", "16bit", "ps1", "pcdemo", "future"] as const;

export type EraPreset = (typeof ERA_PRESETS)[number];

const BLEND_MODES = [
  "source-over",
  "screen",
  "overlay",
  "lighter",
  "multiply",
  "soft-light",
  "hard-light",
  "color-dodge",
  "difference",
  "exclusion",
  "xor"
] as const;

export type BlendMode = (typeof BLEND_MODES)[number];

export type FitAlign = "top" | "centre" | "bottom" | "fill";

export type RawAudioConfig = {
  src: string;
  offset?: number;
};

export type RawIntroTheme = {
  bg: string;
  fg: string;
  accent: string;
  dim: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  padding: number;
  window: {
    title: string;
    chrome: boolean;
  };
};

export type RawIntroScriptEvent = {
  t: number | string;
  type: "prompt" | "type" | "enter" | "output" | "ascii" | "clear";
  text?: string;
  cps?: number;
};

export type RawIntroConfig = {
  mode: "terminal";
  end: number | string;
  theme: RawIntroTheme;
  script: RawIntroScriptEvent[];
};

export type RawSectionConfig = {
  id: string;
  start: number | string;
  end?: number | string;
  effect: string;
  era?: EraPreset;
  layers?: RawSectionLayerConfig[];
  automation?: RawParamAutomation[];
  transition?: {
    in?: TransitionType;
    out?: TransitionType;
    duration?: number;
  };
  params?: Record<string, number>;
  framing?: "auto" | "desktopCinematic" | "mobileFit";
  fitAlign?: FitAlign | "center";
};

export type RawSectionLayerConfig = {
  effect: string;
  opacity?: number;
  blend?: BlendMode;
  params?: Record<string, number>;
  automation?: RawParamAutomation[];
  fitAlign?: FitAlign | "center";
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
  safe?: boolean;
  maxWidth?: number;
};

export type RawTimelineConfig = {
  audio: RawAudioConfig;
  intro: RawIntroConfig;
  sections: RawSectionConfig[];
  textCues?: RawTextCue[];
};

export type RawParamAutomation = {
  param: string;
  from: number;
  to: number;
  t0: number | string;
  t1: number | string;
  ease?: string;
};

export type TransitionConfig = {
  in: TransitionType;
  out: TransitionType;
  duration: number;
};

export type IntroTheme = RawIntroTheme;

export type IntroScriptEvent = {
  t: number;
  type: RawIntroScriptEvent["type"];
  text?: string;
  cps?: number;
};

export type IntroConfig = {
  mode: "terminal";
  end: number;
  theme: IntroTheme;
  script: IntroScriptEvent[];
};

export type SectionConfig = {
  id: string;
  start: number;
  end: number | null;
  effect: string;
  era: EraPreset;
  transition: TransitionConfig;
  params: Record<string, number>;
  automation: ParamAutomation[];
  layers: SectionLayerConfig[];
  endFromAudio: boolean;
  framing: "auto" | "desktopCinematic" | "mobileFit";
  fitAlign: FitAlign;
};

export type SectionLayerConfig = {
  effect: string;
  opacity: number;
  blend: BlendMode;
  params: Record<string, number>;
  automation: ParamAutomation[];
  fitAlign: FitAlign;
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
  safe?: boolean;
  maxWidth?: number;
};

export type TimelineConfig = {
  audio: {
    src: string;
    offset: number;
  };
  intro: IntroConfig;
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
const DEFAULT_INTRO_CPS = 28;

function assertNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be a number`);
  }
  return value;
}

function normalizeBlendMode(value: unknown, label: string): BlendMode {
  if (!value) {
    return "screen";
  }
  if (typeof value !== "string" || !BLEND_MODES.includes(value as BlendMode)) {
    const allowedList = BLEND_MODES.map((mode) => `"${mode}"`).join(", ");
    throw new Error(`${label} must be one of ${allowedList}`);
  }
  return value as BlendMode;
}

function normalizeOpacity(value: unknown, label: string): number {
  if (value === undefined) {
    return 0.6;
  }
  const opacity = assertNumber(value, label);
  if (opacity < 0 || opacity > 1) {
    throw new Error(`${label} must be between 0 and 1`);
  }
  return opacity;
}

function normalizeLayerParams(value: unknown, label: string): Record<string, number> {
  if (value === undefined) {
    return {};
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, number>;
}

function normalizeSectionFraming(value: unknown, label: string): "auto" | "desktopCinematic" | "mobileFit" {
  if (value === undefined) {
    return "auto";
  }
  if (value === "auto" || value === "desktopCinematic" || value === "mobileFit") {
    return value;
  }
  throw new Error(`${label} must be one of "auto", "desktopCinematic", or "mobileFit"`);
}

function normalizeFitAlign(value: unknown, label: string): FitAlign {
  if (value === undefined) {
    return "fill";
  }
  if (value === "center") {
    return "centre";
  }
  if (value === "top" || value === "centre" || value === "bottom" || value === "fill") {
    return value;
  }
  throw new Error(`${label} must be one of "top", "centre", "bottom", or "fill"`);
}

const EASE_NAMES: EaseName[] = [
  "linear",
  "easeInOutQuad",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutCubic",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutQuart",
  "easeInOutQuint",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine",
  "easeInExpo",
  "easeOutExpo",
  "easeInOutExpo",
  "easeInBack",
  "easeOutBack",
  "easeInOutBack",
  "easeOutBounce",
  "easeOutElastic",
  "easeInOutCirc"
];

function normalizeParamAutomation(
  value: unknown,
  label: string
): ParamAutomation[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`${label}[${index}] must be an object`);
    }
    const automation = entry as RawParamAutomation;
    const param = assertString(automation.param, `${label}[${index}].param`);
    const from = assertNumber(automation.from, `${label}[${index}].from`);
    const to = assertNumber(automation.to, `${label}[${index}].to`);
    const t0 = parseTimelineTime(automation.t0, `${label}[${index}].t0`);
    const t1 = parseTimelineTime(automation.t1, `${label}[${index}].t1`);
    let ease: EaseName | undefined;
    if (automation.ease !== undefined) {
      if (typeof automation.ease !== "string") {
        throw new Error(`${label}[${index}].ease must be a string`);
      }
      ease = EASE_NAMES.includes(automation.ease as EaseName) ? (automation.ease as EaseName) : undefined;
    }
    return {
      param,
      from,
      to,
      t0,
      t1,
      ease
    };
  });
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
  const allowedList = TRANSITION_TYPES.map((type) => `"${type}"`).join(", ");
  if (!TRANSITION_TYPES.includes(incoming)) {
    throw new Error(`transition.in must be one of ${allowedList}`);
  }
  if (!TRANSITION_TYPES.includes(outgoing)) {
    throw new Error(`transition.out must be one of ${allowedList}`);
  }
  if (duration <= 0) {
    throw new Error("transition.duration must be positive");
  }
  return { in: incoming, out: outgoing, duration };
}

function normalizeEra(value: unknown, label: string): EraPreset {
  if (!value) {
    return "pcdemo";
  }
  if (typeof value !== "string" || !ERA_PRESETS.includes(value as EraPreset)) {
    const allowedList = ERA_PRESETS.map((preset) => `"${preset}"`).join(", ");
    throw new Error(`${label} must be one of ${allowedList}`);
  }
  return value as EraPreset;
}

function normalizeIntroTheme(theme: RawIntroTheme): IntroTheme {
  return {
    bg: assertString(theme.bg, "intro.theme.bg"),
    fg: assertString(theme.fg, "intro.theme.fg"),
    accent: assertString(theme.accent, "intro.theme.accent"),
    dim: assertString(theme.dim, "intro.theme.dim"),
    fontFamily: assertString(theme.fontFamily, "intro.theme.fontFamily"),
    fontSize: assertNumber(theme.fontSize, "intro.theme.fontSize"),
    lineHeight: assertNumber(theme.lineHeight, "intro.theme.lineHeight"),
    padding: assertNumber(theme.padding, "intro.theme.padding"),
    window: {
      title: assertString(theme.window?.title, "intro.theme.window.title"),
      chrome: Boolean(theme.window?.chrome)
    }
  };
}

function normalizeIntroScript(script: RawIntroScriptEvent[]): IntroScriptEvent[] {
  if (!Array.isArray(script)) {
    throw new Error("intro.script must be an array");
  }
  return script.map((event, index) => {
    const time = parseTimelineTime(event.t, `intro.script[${index}].t`);
    if (
      event.type !== "prompt" &&
      event.type !== "type" &&
      event.type !== "enter" &&
      event.type !== "output" &&
      event.type !== "ascii" &&
      event.type !== "clear"
    ) {
      throw new Error(`intro.script[${index}].type is invalid`);
    }
    if (
      (event.type === "prompt" ||
        event.type === "type" ||
        event.type === "output" ||
        event.type === "ascii") &&
      (!event.text || event.text.length === 0)
    ) {
      throw new Error(`intro.script[${index}].text is required for ${event.type}`);
    }
    if (event.cps !== undefined && (typeof event.cps !== "number" || event.cps <= 0)) {
      throw new Error(`intro.script[${index}].cps must be a positive number`);
    }
    return {
      t: time,
      type: event.type,
      text: event.text,
      cps: event.cps ?? (event.type === "type" ? DEFAULT_INTRO_CPS : undefined)
    };
  });
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

function normalizeSectionLayers(layers: RawSectionLayerConfig[] | undefined, label: string): SectionLayerConfig[] {
  if (!layers) {
    return [];
  }
  if (!Array.isArray(layers)) {
    throw new Error(`${label}.layers must be an array`);
  }
  return layers.map((layer, index) => {
    if (!layer || typeof layer !== "object") {
      throw new Error(`${label}.layers[${index}] must be an object`);
    }
    return {
      effect: assertString(layer.effect, `${label}.layers[${index}].effect`),
      opacity: normalizeOpacity(layer.opacity, `${label}.layers[${index}].opacity`),
      blend: normalizeBlendMode(layer.blend, `${label}.layers[${index}].blend`),
      params: normalizeLayerParams(layer.params, `${label}.layers[${index}].params`),
      automation: normalizeParamAutomation(layer.automation, `${label}.layers[${index}].automation`),
      fitAlign: normalizeFitAlign(layer.fitAlign, `${label}.layers[${index}].fitAlign`)
    };
  });
}

export function normalizeTimelineConfig(raw: RawTimelineConfig): TimelineConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("Timeline config must be an object");
  }
  const audio = raw.audio ?? ({} as RawAudioConfig);
  const audioSrc = assertString(audio.src, "audio.src");
  const audioOffset = audio.offset ?? 0;
  assertNumber(audioOffset, "audio.offset");

  if (!raw.intro || typeof raw.intro !== "object") {
    throw new Error("intro must be an object");
  }
  if (raw.intro.mode !== "terminal") {
    throw new Error('intro.mode must be "terminal"');
  }
  const introEnd = parseTimelineTime(raw.intro.end, "intro.end");
  const introTheme = normalizeIntroTheme(raw.intro.theme);
  const introScript = normalizeIntroScript(raw.intro.script);

  if (!Array.isArray(raw.sections)) {
    throw new Error("sections must be an array");
  }

  const sections = raw.sections.map((section, index) => {
    const start = parseTimelineTime(section.start, `sections[${index}].start`);
    const end =
      section.end !== undefined ? parseTimelineTime(section.end, `sections[${index}].end`) : null;
    if (end !== null && end <= start) {
      throw new Error(`sections[${index}].end must be greater than start`);
    }
    const params = section.params ?? {};
    return {
      id: assertString(section.id, `sections[${index}].id`),
      start,
      end,
      effect: assertString(section.effect, `sections[${index}].effect`),
      era: normalizeEra(section.era, `sections[${index}].era`),
      transition: normalizeTransition(section.transition),
      params,
      automation: normalizeParamAutomation(section.automation, `sections[${index}].automation`),
      layers: normalizeSectionLayers(section.layers, `sections[${index}]`),
      endFromAudio: end === null,
      framing: normalizeSectionFraming(section.framing, `sections[${index}].framing`),
      fitAlign: normalizeFitAlign(section.fitAlign, `sections[${index}].fitAlign`)
    };
  });

  sections.sort((a, b) => a.start - b.start);
  if (sections.length === 0) {
    throw new Error("sections must include at least one entry");
  }
  if (Math.abs(sections[0].start - introEnd) > 0.0001) {
    throw new Error(`Config error: first section must start at ${introEnd}`);
  }
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
      },
      safe: cue.safe,
      maxWidth: cue.maxWidth
    };
  });

  return {
    audio: {
      src: audioSrc,
      offset: audioOffset
    },
    intro: {
      mode: "terminal",
      end: introEnd,
      theme: introTheme,
      script: introScript
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
