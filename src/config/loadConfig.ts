const TRANSITION_TYPES = [
  "fade",
  "wipe",
  "slide-left",
  "slide-right",
  "slide-up",
  "slide-down",
  "iris",
  "flash"
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
  overlays?: RawSectionOverlayConfig;
  transition?: {
    in?: TransitionType;
    out?: TransitionType;
    duration?: number;
  };
  params?: Record<string, number>;
};

export type RawSectionLayerConfig = {
  effect: string;
  opacity?: number;
  blend?: BlendMode;
  params?: Record<string, number>;
};

export type RawLighting2DConfig = {
  enabled?: boolean;
  ambient?: number;
  lights?: RawLighting2DLightConfig[];
  occluders?: RawLighting2DOccluderConfig[];
  shadow?: {
    softness?: number;
    length?: number;
  };
};

export type RawLighting2DLightConfig = {
  kind: "point";
  x: number;
  y: number;
  radius: number;
  intensity: number;
  colour?: string;
  flicker?: number;
  follow?: "none" | "centre" | "beatJitter";
};

export type RawLighting2DOccluderConfig = {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type RawSectionOverlayConfig = {
  lighting2d?: RawLighting2DConfig;
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
  intro: RawIntroConfig;
  sections: RawSectionConfig[];
  textCues?: RawTextCue[];
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
  layers: SectionLayerConfig[];
  overlays: SectionOverlayConfig;
  endFromAudio: boolean;
};

export type SectionLayerConfig = {
  effect: string;
  opacity: number;
  blend: BlendMode;
  params: Record<string, number>;
};

export type Lighting2DConfig = {
  enabled: boolean;
  ambient: number;
  lights: Lighting2DLightConfig[];
  occluders: Lighting2DOccluderConfig[];
  shadow: {
    softness: number;
    length: number;
  };
};

export type Lighting2DLightConfig = {
  kind: "point";
  x: number;
  y: number;
  radius: number;
  intensity: number;
  colour: string;
  flicker: number;
  follow: "none" | "centre" | "beatJitter";
};

export type Lighting2DOccluderConfig = {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
};

export type SectionOverlayConfig = {
  lighting2d?: Lighting2DConfig;
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
const DEFAULT_LIGHTING_AMBIENT = 0.6;
const DEFAULT_SHADOW_SOFTNESS = 0.25;
const DEFAULT_SHADOW_LENGTH = 0.35;

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
      params: normalizeLayerParams(layer.params, `${label}.layers[${index}].params`)
    };
  });
}

function normalizeLighting2DLight(
  light: RawLighting2DLightConfig,
  label: string
): Lighting2DLightConfig {
  if (light.kind !== "point") {
    throw new Error(`${label}.kind must be "point"`);
  }
  const x = assertNumber(light.x, `${label}.x`);
  const y = assertNumber(light.y, `${label}.y`);
  const radius = assertNumber(light.radius, `${label}.radius`);
  const intensity = assertNumber(light.intensity, `${label}.intensity`);
  if (radius <= 0) {
    throw new Error(`${label}.radius must be greater than 0`);
  }
  if (intensity < 0) {
    throw new Error(`${label}.intensity must be >= 0`);
  }
  if (light.flicker !== undefined && (typeof light.flicker !== "number" || light.flicker < 0)) {
    throw new Error(`${label}.flicker must be >= 0`);
  }
  if (
    light.follow &&
    light.follow !== "none" &&
    light.follow !== "centre" &&
    light.follow !== "beatJitter"
  ) {
    throw new Error(`${label}.follow must be "none", "centre", or "beatJitter"`);
  }
  return {
    kind: "point",
    x,
    y,
    radius,
    intensity,
    colour: light.colour ?? "#ffffff",
    flicker: light.flicker ?? 0,
    follow: light.follow ?? "none"
  };
}

function normalizeLighting2DOccluder(
  occluder: RawLighting2DOccluderConfig,
  label: string
): Lighting2DOccluderConfig {
  if (occluder.kind !== "rect") {
    throw new Error(`${label}.kind must be "rect"`);
  }
  const x = assertNumber(occluder.x, `${label}.x`);
  const y = assertNumber(occluder.y, `${label}.y`);
  const w = assertNumber(occluder.w, `${label}.w`);
  const h = assertNumber(occluder.h, `${label}.h`);
  if (w <= 0 || h <= 0) {
    throw new Error(`${label}.w and ${label}.h must be > 0`);
  }
  return { kind: "rect", x, y, w, h };
}

function normalizeLighting2DConfig(
  lighting: RawLighting2DConfig,
  label: string
): Lighting2DConfig {
  const ambient = lighting.ambient ?? DEFAULT_LIGHTING_AMBIENT;
  if (typeof ambient !== "number" || ambient < 0 || ambient > 1) {
    throw new Error(`${label}.ambient must be between 0 and 1`);
  }
  const lights = lighting.lights ?? [];
  if (!Array.isArray(lights)) {
    throw new Error(`${label}.lights must be an array`);
  }
  const occluders = lighting.occluders ?? [];
  if (!Array.isArray(occluders)) {
    throw new Error(`${label}.occluders must be an array`);
  }
  const shadowSoftness = lighting.shadow?.softness ?? DEFAULT_SHADOW_SOFTNESS;
  const shadowLength = lighting.shadow?.length ?? DEFAULT_SHADOW_LENGTH;
  if (typeof shadowSoftness !== "number" || shadowSoftness < 0 || shadowSoftness > 1) {
    throw new Error(`${label}.shadow.softness must be between 0 and 1`);
  }
  if (typeof shadowLength !== "number" || shadowLength < 0) {
    throw new Error(`${label}.shadow.length must be >= 0`);
  }
  return {
    enabled: Boolean(lighting.enabled),
    ambient,
    lights: lights.map((light, index) =>
      normalizeLighting2DLight(light, `${label}.lights[${index}]`)
    ),
    occluders: occluders.map((occluder, index) =>
      normalizeLighting2DOccluder(occluder, `${label}.occluders[${index}]`)
    ),
    shadow: {
      softness: shadowSoftness,
      length: shadowLength
    }
  };
}

function normalizeSectionOverlays(
  overlays: RawSectionOverlayConfig | undefined,
  label: string
): SectionOverlayConfig {
  if (!overlays) {
    return {};
  }
  if (typeof overlays !== "object") {
    throw new Error(`${label} must be an object`);
  }
  return {
    lighting2d: overlays.lighting2d ? normalizeLighting2DConfig(overlays.lighting2d, `${label}.lighting2d`) : undefined
  };
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
      layers: normalizeSectionLayers(section.layers, `sections[${index}]`),
      overlays: normalizeSectionOverlays(section.overlays, `sections[${index}].overlays`),
      endFromAudio: end === null
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
      }
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
