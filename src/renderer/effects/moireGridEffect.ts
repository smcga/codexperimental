import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type MoirePalette = "cyan" | "magenta" | "amber";

type MoireGridParams = {
  spacing: number;
  lineWidth: number;
  speed: number;
  warp: number;
  intensity: number;
  palette: MoirePalette;
  audioReact: number;
};

export const MOIRE_GRID_DEFAULTS = {
  spacing: 18,
  lineWidth: 1.5,
  speed: 1,
  warp: 14,
  intensity: 0.7,
  palette: "cyan",
  audioReact: 0.35
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolvePalette = (value: unknown): MoirePalette => {
  if (value === "cyan" || value === "magenta" || value === "amber") {
    return value;
  }
  return MOIRE_GRID_DEFAULTS.palette;
};

export const resolveMoireGridParams = (params: Record<string, unknown>): MoireGridParams => ({
  spacing: clamp(toNumber(params.spacing, MOIRE_GRID_DEFAULTS.spacing), 6, 80),
  lineWidth: clamp(toNumber(params.lineWidth, MOIRE_GRID_DEFAULTS.lineWidth), 0.5, 12),
  speed: clamp(toNumber(params.speed, MOIRE_GRID_DEFAULTS.speed), -6, 6),
  warp: clamp(toNumber(params.warp, MOIRE_GRID_DEFAULTS.warp), 0, 120),
  intensity: clamp(toNumber(params.intensity, MOIRE_GRID_DEFAULTS.intensity), 0.1, 1),
  palette: resolvePalette(params.palette),
  audioReact: clamp(toNumber(params.audioReact, MOIRE_GRID_DEFAULTS.audioReact), 0, 1)
});

const paletteToColor = (palette: MoirePalette): [number, number, number] => {
  switch (palette) {
    case "magenta":
      return [255, 96, 220];
    case "amber":
      return [255, 200, 80];
    case "cyan":
    default:
      return [90, 235, 255];
  }
};

export class MoireGridEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveMoireGridParams(params as Record<string, unknown>);
    const beatBoost = audio.beat ? 1 : 0;
    const amp = config.warp * (1 + audio.bass * config.audioReact + beatBoost * config.audioReact * 0.5);
    const [r, g, b] = paletteToColor(config.palette);

    ctx.fillStyle = "rgb(6, 8, 16)";
    ctx.fillRect(0, 0, width, height);

    const alpha = clamp(config.intensity * (0.8 + audio.rms * config.audioReact), 0.05, 1);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;

    const spacing = Math.max(1, config.spacing);
    const phase = time * config.speed;

    for (let x = 0; x <= width; x += spacing) {
      const offset = Math.sin(phase + x * 0.017) * amp;
      ctx.fillRect(x + offset, 0, config.lineWidth, height);
    }

    for (let y = 0; y <= height; y += spacing) {
      const offset = Math.cos(phase * 0.9 + y * 0.02) * amp;
      ctx.fillRect(0, y + offset, width, config.lineWidth);
    }
  }
}
