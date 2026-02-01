import { AudioFeatures } from "../../../audio/audioPlayer";
import { clamp } from "../../../util/math";
import { Effect, EffectRenderContext } from "../types";
import { TunnelEffect } from "../tunnelEffect";
import { WebGLEffectBase, WebGLUniforms } from "./webglEffectBase";
import { FRACTAL_TUNNEL_FRAGMENT } from "./shaders/fractalTunnel";
import { setWebGLStatus } from "./webglStatus";

export type FractalTunnelParams = {
  quality: number;
  warp: number;
  hueShift: number;
  exposure: number;
  seed: number;
};

export const DEFAULT_FRACTAL_TUNNEL_PARAMS: FractalTunnelParams = {
  quality: 2,
  warp: 1.1,
  hueShift: 0.15,
  exposure: 1.2,
  seed: 7
};

const QUALITY_SCALE: Record<number, number> = {
  1: 0.68,
  2: 0.85,
  3: 1
};

const toFiniteNumber = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const clampQuality = (value: number): number => clamp(Math.round(value), 1, 3);

export const coerceFractalTunnelParams = (params: Record<string, number>): FractalTunnelParams => ({
  quality: clampQuality(toFiniteNumber(params.quality, DEFAULT_FRACTAL_TUNNEL_PARAMS.quality)),
  warp: clamp(toFiniteNumber(params.warp, DEFAULT_FRACTAL_TUNNEL_PARAMS.warp), 0, 2),
  hueShift: clamp(toFiniteNumber(params.hueShift, DEFAULT_FRACTAL_TUNNEL_PARAMS.hueShift), 0, 1),
  exposure: clamp(toFiniteNumber(params.exposure, DEFAULT_FRACTAL_TUNNEL_PARAMS.exposure), 0.5, 2),
  seed: toFiniteNumber(params.seed, DEFAULT_FRACTAL_TUNNEL_PARAMS.seed)
});

export const buildFractalTunnelUniforms = (
  time: number,
  width: number,
  height: number,
  audio: AudioFeatures,
  params: FractalTunnelParams
): WebGLUniforms => ({
  time,
  resolution: [width, height],
  rms: clamp(audio.rms, 0, 1),
  bass: clamp(audio.bass, 0, 1),
  mid: clamp(audio.mid, 0, 1),
  treble: clamp(audio.treble, 0, 1),
  beat: audio.beat ? 1 : 0,
  beatStrength: clamp(audio.beatStrength, 0, 1),
  quality: params.quality,
  warp: params.warp,
  hueShift: params.hueShift,
  exposure: params.exposure,
  seed: params.seed
});

let webglUnavailableLogged = false;
let shaderErrorLogged = false;

export class FractalTunnelEffect implements Effect {
  private renderer: WebGLEffectBase | null = null;
  private fallback = new TunnelEffect();
  private activeRendererName: "webgl" | "tunnel" = "webgl";

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const coercedParams = coerceFractalTunnelParams(params);
    const qualityScale = QUALITY_SCALE[coercedParams.quality] ?? 1;
    const renderWidth = Math.max(1, Math.round(width * qualityScale));
    const renderHeight = Math.max(1, Math.round(height * qualityScale));

    if (!this.renderer) {
      this.renderer = this.createRenderer();
    }

    if (!this.renderer) {
      this.activeRendererName = "tunnel";
      setWebGLStatus("fallback");
      this.fallback.render({ ctx, width, height, time, delta: 0, audio, params });
      return;
    }

    this.activeRendererName = "webgl";
    setWebGLStatus("ok");
    const uniforms = buildFractalTunnelUniforms(time, renderWidth, renderHeight, audio, coercedParams);
    this.renderer.render(ctx, width, height, uniforms);
  }

  reset(): void {
    this.fallback = new TunnelEffect();
  }

  getActiveRendererName(): "webgl" | "tunnel" {
    return this.activeRendererName;
  }

  private createRenderer(): WebGLEffectBase | null {
    if (typeof document === "undefined") {
      if (!webglUnavailableLogged) {
        console.warn("[gl_fractal_tunnel] WebGL2 unavailable; falling back to tunnel effect.");
        webglUnavailableLogged = true;
      }
      return null;
    }
    try {
      return new WebGLEffectBase(FRACTAL_TUNNEL_FRAGMENT);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("WebGL2 unavailable")) {
        if (!webglUnavailableLogged) {
          console.warn("[gl_fractal_tunnel] WebGL2 unavailable; falling back to tunnel effect.");
          webglUnavailableLogged = true;
        }
      } else if (!shaderErrorLogged) {
        console.warn("[gl_fractal_tunnel] WebGL shader init failed; falling back.", error);
        shaderErrorLogged = true;
      }
      return null;
    }
  }
}
