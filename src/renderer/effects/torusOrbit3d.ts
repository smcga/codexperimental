import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type TorusOrbitPalette = "teal" | "violet" | "amber";

type TorusOrbit3dParams = {
  ringCount: number;
  pointsPerRing: number;
  majorRadius: number;
  minorRadius: number;
  spinSpeed: number;
  wobbleSpeed: number;
  depth: number;
  glow: number;
  palette: TorusOrbitPalette;
  audioReact: number;
};

export const TORUS_ORBIT_3D_DEFAULTS = {
  ringCount: 9,
  pointsPerRing: 48,
  majorRadius: 0.9,
  minorRadius: 0.34,
  spinSpeed: 0.85,
  wobbleSpeed: 0.55,
  depth: 3.4,
  glow: 0.65,
  palette: "teal",
  audioReact: 0.5
} as const;

const toNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const resolvePalette = (value: unknown): TorusOrbitPalette => {
  if (value === "violet" || value === "amber" || value === "teal") {
    return value;
  }
  return TORUS_ORBIT_3D_DEFAULTS.palette;
};

export const resolveTorusOrbit3dParams = (params: Record<string, unknown>): TorusOrbit3dParams => ({
  ringCount: Math.round(clamp(toNumber(params.ringCount, TORUS_ORBIT_3D_DEFAULTS.ringCount), 3, 24)),
  pointsPerRing: Math.round(clamp(toNumber(params.pointsPerRing, TORUS_ORBIT_3D_DEFAULTS.pointsPerRing), 8, 240)),
  majorRadius: clamp(toNumber(params.majorRadius, TORUS_ORBIT_3D_DEFAULTS.majorRadius), 0.2, 1.8),
  minorRadius: clamp(toNumber(params.minorRadius, TORUS_ORBIT_3D_DEFAULTS.minorRadius), 0.05, 1.2),
  spinSpeed: clamp(toNumber(params.spinSpeed, TORUS_ORBIT_3D_DEFAULTS.spinSpeed), -4, 4),
  wobbleSpeed: clamp(toNumber(params.wobbleSpeed, TORUS_ORBIT_3D_DEFAULTS.wobbleSpeed), -3, 3),
  depth: clamp(toNumber(params.depth, TORUS_ORBIT_3D_DEFAULTS.depth), 2, 8),
  glow: clamp(toNumber(params.glow, TORUS_ORBIT_3D_DEFAULTS.glow), 0, 1),
  palette: resolvePalette(params.palette),
  audioReact: clamp(toNumber(params.audioReact, TORUS_ORBIT_3D_DEFAULTS.audioReact), 0, 1)
});

const paletteColor = (palette: TorusOrbitPalette): [number, number, number] => {
  switch (palette) {
    case "violet":
      return [180, 120, 255];
    case "amber":
      return [255, 190, 100];
    case "teal":
    default:
      return [80, 235, 225];
  }
};

export class TorusOrbit3dEffect implements Effect {
  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const config = resolveTorusOrbit3dParams(params as Record<string, unknown>);
    const [r, g, b] = paletteColor(config.palette);
    const beatKick = audio.beat ? 0.35 : 0;
    const react = 1 + config.audioReact * (audio.bass * 0.9 + audio.rms * 0.55 + beatKick);

    ctx.fillStyle = "rgb(2, 6, 12)";
    ctx.fillRect(0, 0, width, height);

    const scaleBase = Math.min(width, height) * 0.22;
    const zDistance = config.depth + config.audioReact * audio.rms * 0.6;
    const spin = time * config.spinSpeed;
    const wobble = time * config.wobbleSpeed;

    for (let ring = 0; ring < config.ringCount; ring += 1) {
      const ringPhase = (ring / config.ringCount) * Math.PI * 2;
      const localMajor = config.majorRadius * react * (1 + Math.sin(wobble + ringPhase * 1.4) * 0.12);
      for (let i = 0; i < config.pointsPerRing; i += 1) {
        const t = (i / config.pointsPerRing) * Math.PI * 2;
        const x0 = (localMajor + config.minorRadius * Math.cos(t)) * Math.cos(ringPhase);
        const y0 = (localMajor + config.minorRadius * Math.cos(t)) * Math.sin(ringPhase);
        const z0 = config.minorRadius * Math.sin(t);

        const angleY = spin + ringPhase * 0.75;
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = x0 * cosY + z0 * sinY;
        const z1 = -x0 * sinY + z0 * cosY;

        const angleX = wobble * 0.7;
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = y0 * cosX - z1 * sinX;
        const z2 = y0 * sinX + z1 * cosX;

        const perspective = 1 / (zDistance + z2);
        const px = width * 0.5 + x1 * perspective * scaleBase;
        const py = height * 0.5 + y2 * perspective * scaleBase;
        const dotRadius = (0.8 + config.glow * 1.7) * perspective * width * 0.05;
        const alpha = clamp((0.35 + config.glow * 0.45) * perspective * zDistance, 0.03, 1);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
