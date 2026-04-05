import { Effect, EffectRenderContext } from "./types";

export const MARBLE_DEFAULTS = {
  scale: 3.0,
  veinScale: 2.5,
  contrast: 1.2,
  brightness: 1.0,
  speed: 0.15,
  turbulence: 0.8,
  layers: 4,
  colorA: [220, 220, 230],
  colorB: [40, 40, 50],
  colorVein: [255, 255, 255]
} as const;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const mixChannel = (a: number, b: number, t: number): number => a + (b - a) * t;

const normalizeAudio = (value: number | undefined): number => clamp(value ?? 0, 0, 1.5);

export function createPseudoNoise(layers: number): (x: number, y: number) => number {
  const layerCount = clamp(Math.floor(layers), 1, 7);
  return (x: number, y: number): number => {
    let n = 0;
    let ampSum = 0;
    for (let i = 0; i < layerCount; i += 1) {
      const frequency = 1 << i;
      const amplitude = 1 / frequency;
      n += Math.sin(x * frequency + Math.sin(y * frequency)) * amplitude;
      ampSum += amplitude;
    }
    return ampSum > 0 ? n / ampSum : 0;
  };
}

export function createMarbleEffect(): Effect {
  let imageData: ImageData | null = null;
  let cachedWidth = 0;
  let cachedHeight = 0;
  let xCoords = new Float32Array(0);

  const ensureBuffers = (ctx: CanvasRenderingContext2D, width: number, height: number): Uint8ClampedArray => {
    if (!imageData || width !== cachedWidth || height !== cachedHeight) {
      imageData = ctx.createImageData(width, height);
      cachedWidth = width;
      cachedHeight = height;
      xCoords = new Float32Array(width);
    }
    return imageData.data;
  };

  return {
    render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
      if (width <= 0 || height <= 0) {
        return;
      }

      const scale = clamp(params.scale ?? MARBLE_DEFAULTS.scale, 0.4, 8);
      const veinScaleBase = clamp(params.veinScale ?? MARBLE_DEFAULTS.veinScale, 0.2, 8);
      const contrast = clamp(params.contrast ?? MARBLE_DEFAULTS.contrast, 0.2, 4);
      const baseBrightness = clamp(params.brightness ?? MARBLE_DEFAULTS.brightness, 0.2, 2.5);
      const speed = clamp(params.speed ?? MARBLE_DEFAULTS.speed, 0, 2);
      const turbulenceBase = clamp(params.turbulence ?? MARBLE_DEFAULTS.turbulence, 0, 2.5);
      const layers = clamp(params.layers ?? MARBLE_DEFAULTS.layers, 1, 7);

      const bass = normalizeAudio(audio.bass);
      const mid = normalizeAudio(audio.mid);
      const rms = normalizeAudio(audio.rms ?? audio.energy);

      const turbulence = turbulenceBase * (1 + bass * 0.16);
      const veinScale = veinScaleBase * (1 + (mid - 0.5) * 0.2);
      const brightness = baseBrightness * (1 + rms * 0.12);

      const elapsed = time * speed;
      const noise = createPseudoNoise(layers);
      const data = ensureBuffers(ctx, width, height);
      const invWidth = 1 / width;
      const invHeight = 1 / height;
      const halfScale = 0.5 * scale;

      for (let px = 0; px < width; px += 1) {
        xCoords[px] = (px * invWidth - 0.5) * scale;
      }

      let index = 0;
      for (let py = 0; py < height; py += 1) {
        const y = (py * invHeight - 0.5) * scale;
        for (let px = 0; px < width; px += 1) {
          const x = xCoords[px];
          const nx = x + turbulence * noise(x + halfScale, y + elapsed);
          const ny = y + turbulence * noise(x - elapsed, y - halfScale);

          const v = Math.sin((nx * veinScale + noise(nx + elapsed * 0.2, ny - elapsed * 0.15)) * Math.PI);
          const m = 0.5 + 0.5 * v;
          const baseMix = m;
          const vein = Math.pow(m, contrast * 4);

          const baseR = mixChannel(MARBLE_DEFAULTS.colorA[0], MARBLE_DEFAULTS.colorB[0], baseMix);
          const baseG = mixChannel(MARBLE_DEFAULTS.colorA[1], MARBLE_DEFAULTS.colorB[1], baseMix);
          const baseB = mixChannel(MARBLE_DEFAULTS.colorA[2], MARBLE_DEFAULTS.colorB[2], baseMix);

          data[index] = clamp(mixChannel(baseR, MARBLE_DEFAULTS.colorVein[0], vein) * brightness, 0, 255);
          data[index + 1] = clamp(mixChannel(baseG, MARBLE_DEFAULTS.colorVein[1], vein) * brightness, 0, 255);
          data[index + 2] = clamp(mixChannel(baseB, MARBLE_DEFAULTS.colorVein[2], vein) * brightness, 0, 255);
          data[index + 3] = 255;
          index += 4;
        }
      }

      ctx.putImageData(imageData!, 0, 0);
    }
  };
}
