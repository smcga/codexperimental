import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type LiveDomWaveOpticsParams = {
  geometryDensity: number;
  diffraction: number;
  dispersion: number;
  causticStrength: number;
  interference: number;
  refraction: number;
  gloss: number;
  animationSpeed: number;
  audioReactive: number;
  seed: number;
};

export const LIVE_DOM_WAVE_OPTICS_DEFAULTS: LiveDomWaveOpticsParams = {
  geometryDensity: 1,
  diffraction: 0.75,
  dispersion: 0.8,
  causticStrength: 0.9,
  interference: 0.7,
  refraction: 0.6,
  gloss: 0.5,
  animationSpeed: 1,
  audioReactive: 0.35,
  seed: 7
};

const toNum = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const resolveLiveDomWaveOpticsParams = (params: Record<string, unknown>): LiveDomWaveOpticsParams => ({
  geometryDensity: clamp(toNum(params.geometryDensity, LIVE_DOM_WAVE_OPTICS_DEFAULTS.geometryDensity), 0.25, 2),
  diffraction: clamp(toNum(params.diffraction, LIVE_DOM_WAVE_OPTICS_DEFAULTS.diffraction), 0, 1.5),
  dispersion: clamp(toNum(params.dispersion, LIVE_DOM_WAVE_OPTICS_DEFAULTS.dispersion), 0, 1.5),
  causticStrength: clamp(toNum(params.causticStrength, LIVE_DOM_WAVE_OPTICS_DEFAULTS.causticStrength), 0, 2),
  interference: clamp(toNum(params.interference, LIVE_DOM_WAVE_OPTICS_DEFAULTS.interference), 0, 2),
  refraction: clamp(toNum(params.refraction, LIVE_DOM_WAVE_OPTICS_DEFAULTS.refraction), 0, 1.5),
  gloss: clamp(toNum(params.gloss, LIVE_DOM_WAVE_OPTICS_DEFAULTS.gloss), 0, 1.5),
  animationSpeed: clamp(toNum(params.animationSpeed, LIVE_DOM_WAVE_OPTICS_DEFAULTS.animationSpeed), 0, 3),
  audioReactive: clamp(toNum(params.audioReactive, LIVE_DOM_WAVE_OPTICS_DEFAULTS.audioReactive), 0, 1),
  seed: toNum(params.seed, LIVE_DOM_WAVE_OPTICS_DEFAULTS.seed)
});

const hash = (x: number, y: number, seed: number): number => {
  const v = Math.sin(x * 157.31 + y * 289.19 + seed * 91.7) * 43758.5453;
  return v - Math.floor(v);
};

export class LiveDomWaveOpticsEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveLiveDomWaveOpticsParams(params as Record<string, unknown>);
    const energy = config.audioReactive * (audio.rms * 0.65 + audio.treble * 0.35 + (audio.beat ? 0.45 : 0));
    const t = time * config.animationSpeed * (1 + energy * 0.4);

    ctx.fillStyle = "#030711";
    ctx.fillRect(0, 0, width, height);

    const cols = Math.max(4, Math.round(9 * config.geometryDensity));
    const rows = Math.max(3, Math.round(5 * config.geometryDensity));
    const cellW = width / cols;
    const cellH = height / rows;

    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        const n = hash(gx, gy, config.seed);
        const x = gx * cellW;
        const y = gy * cellH;
        const w = cellW * (0.55 + n * 0.35);
        const h = cellH * (0.5 + n * 0.4);
        const phase = t * (0.8 + n) + gx * 0.5 - gy * 0.4;

        const interference = Math.sin(phase * (2.4 + config.interference)) * 0.5 + 0.5;
        const caustic = Math.pow(Math.max(0, Math.sin(phase * (3.2 + config.causticStrength * 2))), 2.2);
        const refractShift = (Math.sin(phase * 1.4) + Math.cos(phase * 1.1)) * config.refraction * 8;

        const r = Math.round(clamp(70 + 160 * interference + 50 * config.dispersion, 0, 255));
        const g = Math.round(clamp(50 + 140 * caustic + 60 * config.diffraction, 0, 255));
        const b = Math.round(clamp(120 + 120 * (1 - interference) + 80 * config.dispersion, 0, 255));

        ctx.save();
        ctx.translate(x + cellW * 0.5 + refractShift, y + cellH * 0.5 - refractShift * 0.3);
        ctx.rotate(Math.sin(phase) * 0.1);
        ctx.globalAlpha = 0.14 + caustic * 0.35;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(-w * 0.5, -h * 0.5, w, h);

        if (config.gloss > 0.01) {
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = (0.08 + interference * 0.2) * config.gloss;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(-w * 0.5, -h * 0.45, w, h * 0.15);
        }
        ctx.restore();
      }
    }
  }
}
