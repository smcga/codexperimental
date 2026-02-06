import { clamp } from "../util/math";

const DEFAULT_BASE_WIDTH = 320;
const DEFAULT_BASE_HEIGHT = 180;
const MIN_BASE_WIDTH = 320;
const MAX_BASE_WIDTH = 1920;
const MIN_BASE_HEIGHT = 180;
const MAX_BASE_HEIGHT = 1080;
const MIN_BASE_SCALE = 1;
const MAX_BASE_SCALE = 4;
const MIN_QUALITY_SCALE = 0.65;
const MAX_QUALITY_SCALE = 1.0;

export type RenderSettings = {
  baseWidth: number;
  baseHeight: number;
  baseScale: number;
  qualityScale: number;
  autoQuality: boolean;
};

const parseNumber = (value: string | null): number | null => {
  if (value === null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseBoolean = (value: string | null): boolean => value === "1" || value === "true";

const isValid16x9 = (width: number, height: number): boolean => width * 9 === height * 16;

const isWithinBounds = (width: number, height: number): boolean =>
  width >= MIN_BASE_WIDTH &&
  width <= MAX_BASE_WIDTH &&
  height >= MIN_BASE_HEIGHT &&
  height <= MAX_BASE_HEIGHT;

export function getRenderSettings(params: URLSearchParams): RenderSettings {
  const baseScaleParam = parseNumber(params.get("baseScale"));
  const baseScale = clamp(baseScaleParam ?? 1, MIN_BASE_SCALE, MAX_BASE_SCALE);
  let baseWidth = Math.round(DEFAULT_BASE_WIDTH * baseScale);
  let baseHeight = Math.round(DEFAULT_BASE_HEIGHT * baseScale);

  const baseWidthParam = parseNumber(params.get("baseW"));
  const baseHeightParam = parseNumber(params.get("baseH"));
  if (
    baseWidthParam !== null &&
    baseHeightParam !== null &&
    isValid16x9(baseWidthParam, baseHeightParam) &&
    isWithinBounds(baseWidthParam, baseHeightParam)
  ) {
    baseWidth = Math.round(baseWidthParam);
    baseHeight = Math.round(baseHeightParam);
  }

  const qualityParam = parseNumber(params.get("quality"));
  const qualityScale = clamp(qualityParam ?? 1, MIN_QUALITY_SCALE, MAX_QUALITY_SCALE);
  const autoQuality = parseBoolean(params.get("autoQuality"));

  return {
    baseWidth,
    baseHeight,
    baseScale,
    qualityScale,
    autoQuality
  };
}

export const renderSettingsDefaults = {
  DEFAULT_BASE_WIDTH,
  DEFAULT_BASE_HEIGHT,
  MIN_BASE_WIDTH,
  MAX_BASE_WIDTH,
  MIN_BASE_HEIGHT,
  MAX_BASE_HEIGHT,
  MIN_BASE_SCALE,
  MAX_BASE_SCALE,
  MIN_QUALITY_SCALE,
  MAX_QUALITY_SCALE
};
