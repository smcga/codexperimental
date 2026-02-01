import { clamp } from "../../util/math";

export type FlyoverPalette = "day" | "sunset" | "night";

export type FlyoverDebugParams = {
  speed: number;
  horizon: number;
  seaDetail: number;
  waveSpeed: number;
  waveIntensity: number;
  islandCount: number;
  islandSeed: number;
  fog: number;
  palette: FlyoverPalette;
  audioReactive: number;
};

export const DEFAULT_FLYOVER_PARAMS: FlyoverDebugParams = {
  speed: 1.0,
  horizon: 0.45,
  seaDetail: 1.0,
  waveSpeed: 1.0,
  waveIntensity: 1.0,
  islandCount: 4,
  islandSeed: 1,
  fog: 0.65,
  palette: "sunset",
  audioReactive: 0.35
};

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && !Number.isNaN(value) ? value : fallback;

const resolvePalette = (value: unknown): FlyoverPalette =>
  value === "day" || value === "sunset" || value === "night" ? value : DEFAULT_FLYOVER_PARAMS.palette;

export function coerceFlyoverParams(overrides: Partial<FlyoverDebugParams>): FlyoverDebugParams {
  const merged = { ...DEFAULT_FLYOVER_PARAMS, ...overrides };
  return {
    speed: Math.max(0, toNumber(merged.speed, DEFAULT_FLYOVER_PARAMS.speed)),
    horizon: clamp(toNumber(merged.horizon, DEFAULT_FLYOVER_PARAMS.horizon), 0, 1),
    seaDetail: Math.max(0.5, toNumber(merged.seaDetail, DEFAULT_FLYOVER_PARAMS.seaDetail)),
    waveSpeed: Math.max(0, toNumber(merged.waveSpeed, DEFAULT_FLYOVER_PARAMS.waveSpeed)),
    waveIntensity: Math.max(0, toNumber(merged.waveIntensity, DEFAULT_FLYOVER_PARAMS.waveIntensity)),
    islandCount: Math.max(1, Math.round(toNumber(merged.islandCount, DEFAULT_FLYOVER_PARAMS.islandCount))),
    islandSeed: Math.round(toNumber(merged.islandSeed, DEFAULT_FLYOVER_PARAMS.islandSeed)),
    fog: clamp(toNumber(merged.fog, DEFAULT_FLYOVER_PARAMS.fog), 0, 1),
    palette: resolvePalette(merged.palette),
    audioReactive: clamp(toNumber(merged.audioReactive, DEFAULT_FLYOVER_PARAMS.audioReactive), 0, 1)
  };
}
