import { clamp } from "../../util/math";

export type SsaoPostParams = {
  radius: number;
  intensity: number;
  bias: number;
  samples: number;
  luminanceInfluence: number;
  edgeBoost: number;
};

const KERNEL = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1]
] as const;

export const calculateLuminance = (r: number, g: number, b: number): number => r * 0.299 + g * 0.587 + b * 0.114;

export const resolveSsaoAo = (occlusion: number, intensity: number): number => clamp(1 - occlusion * intensity, 0.2, 1);

export const applySsaoCanvas = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SsaoPostParams,
  source?: HTMLCanvasElement
): void => {
  if (width <= 2 || height <= 2) {
    return;
  }

  const input = source ?? ctx.canvas;
  const stride = Math.max(1, Math.floor(width > 900 || height > 900 ? 2 : 1));
  const sampleCount = Math.max(1, Math.min(8, Math.round(params.samples)));
  const radius = Math.max(1, Math.round(params.radius / stride));

  const readData = ctx.getImageData(0, 0, width, height);
  if (source) {
    const tmp = document.createElement("canvas");
    tmp.width = width;
    tmp.height = height;
    const tmpCtx = tmp.getContext("2d");
    if (tmpCtx) {
      tmpCtx.drawImage(input, 0, 0, width, height);
      const srcData = tmpCtx.getImageData(0, 0, width, height);
      readData.data.set(srcData.data);
    }
  }

  const src = readData.data;
  const out = new Uint8ClampedArray(src);

  for (let y = 1; y < height - 1; y += stride) {
    for (let x = 1; x < width - 1; x += stride) {
      const idx = (y * width + x) * 4;
      const lum = calculateLuminance(src[idx], src[idx + 1], src[idx + 2]) / 255;

      let occlusion = 0;
      for (let s = 0; s < sampleCount; s += 1) {
        const [kx, ky] = KERNEL[s % KERNEL.length];
        const nx = Math.max(0, Math.min(width - 1, x + kx * radius));
        const ny = Math.max(0, Math.min(height - 1, y + ky * radius));
        const nIdx = (ny * width + nx) * 4;
        const nLum = calculateLuminance(src[nIdx], src[nIdx + 1], src[nIdx + 2]) / 255;
        const diff = nLum - lum;
        const lumWeight = 1 - lum * clamp(params.luminanceInfluence, 0, 1);
        if (diff > params.bias) {
          occlusion += lumWeight;
        }
      }

      occlusion /= sampleCount;

      const rightIdx = (y * width + Math.min(width - 1, x + 1)) * 4;
      const downIdx = (Math.min(height - 1, y + 1) * width + x) * 4;
      const edgeX = Math.abs(calculateLuminance(src[rightIdx], src[rightIdx + 1], src[rightIdx + 2]) / 255 - lum);
      const edgeY = Math.abs(calculateLuminance(src[downIdx], src[downIdx + 1], src[downIdx + 2]) / 255 - lum);
      const edge = (edgeX + edgeY) * clamp(params.edgeBoost, 0, 2);
      const ao = resolveSsaoAo(clamp(occlusion + edge, 0, 0.92), clamp(params.intensity, 0, 1.2));

      const maxX = Math.min(width, x + stride);
      const maxY = Math.min(height, y + stride);
      for (let yy = y; yy < maxY; yy += 1) {
        for (let xx = x; xx < maxX; xx += 1) {
          const writeIdx = (yy * width + xx) * 4;
          out[writeIdx] = Math.round(src[writeIdx] * ao);
          out[writeIdx + 1] = Math.round(src[writeIdx + 1] * ao);
          out[writeIdx + 2] = Math.round(src[writeIdx + 2] * ao);
        }
      }
    }
  }

  ctx.putImageData(new ImageData(out, width, height), 0, 0);
};
