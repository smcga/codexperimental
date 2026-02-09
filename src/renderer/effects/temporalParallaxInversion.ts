import { clamp, lerp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const TAU = Math.PI * 2;
const MAX_SPHERES = 24;
const EPSILON = 1e-4;

export const TEMPORAL_PARALLAX_INVERSION_DEFAULTS = {
  pixelSize: 3,
  sphereCount: 14,
  depthRange: 24,
  timeScale: 1.2,
  depthGamma: 1.35,
  allowLead: 1,
  foldAmount: 0.35,
  foldFreq: 1.8,
  foldSpeed: 0.35,
  bassReverse: 0.45,
  audioReact: 0.5,
  palette: 0,
} as const;

type Palette = {
  backgroundTop: [number, number, number];
  backgroundBottom: [number, number, number];
  rim: [number, number, number];
  fog: [number, number, number];
  sphereA: [number, number, number];
  sphereB: [number, number, number];
};

const PALETTES: Palette[] = [
  {
    backgroundTop: [8, 12, 28],
    backgroundBottom: [22, 6, 26],
    rim: [92, 170, 255],
    fog: [66, 34, 70],
    sphereA: [255, 120, 176],
    sphereB: [94, 164, 255],
  },
  {
    backgroundTop: [5, 16, 18],
    backgroundBottom: [6, 40, 52],
    rim: [137, 255, 194],
    fog: [30, 80, 74],
    sphereA: [254, 214, 95],
    sphereB: [69, 202, 200],
  },
  {
    backgroundTop: [30, 8, 38],
    backgroundBottom: [8, 8, 24],
    rim: [218, 148, 255],
    fog: [90, 48, 112],
    sphereA: [255, 148, 88],
    sphereB: [112, 118, 255],
  },
];

export const getTpiPalette = (paletteIndex: number): Palette => {
  const index = Math.abs(Math.round(paletteIndex)) % PALETTES.length;
  return PALETTES[index];
};

export const computeFoldModulation = (
  depthNorm: number,
  time: number,
  foldFreq: number,
  foldSpeed: number,
  foldAmount: number
): number => {
  const fold = Math.sin(depthNorm * TAU * foldFreq + time * foldSpeed);
  return fold * foldAmount;
};

export const depthToDeltaT = (
  depthNormInput: number,
  params: Pick<typeof TEMPORAL_PARALLAX_INVERSION_DEFAULTS, "timeScale" | "depthGamma" | "allowLead" | "foldAmount" | "foldFreq" | "foldSpeed">,
  time: number
): number => {
  const depthNorm = clamp(depthNormInput, 0, 1);
  const baseDelta = params.timeScale * Math.pow(depthNorm, Math.max(0.01, params.depthGamma));
  const signed = params.allowLead > 0 ? lerp(-baseDelta, baseDelta, depthNorm) : baseDelta;
  return signed + computeFoldModulation(depthNorm, time, params.foldFreq, params.foldSpeed, params.foldAmount);
};

export class TemporalParallaxInversionEffect implements Effect {
  private bufferCanvas: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private pixels: Uint8ClampedArray | null = null;
  private bufW = 0;
  private bufH = 0;

  private readonly sphereDataNow = new Float32Array(MAX_SPHERES * 7);

  reset(): void {
    this.bufferCanvas = null;
    this.bufferCtx = null;
    this.imageData = null;
    this.pixels = null;
    this.bufW = 0;
    this.bufH = 0;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const pixelSize = clamp(Math.floor(params.pixelSize ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.pixelSize), 2, 8);
    const internalW = Math.max(64, Math.floor(width / pixelSize));
    const internalH = Math.max(48, Math.floor(height / pixelSize));

    this.ensureBuffer(internalW, internalH);
    if (!this.imageData || !this.pixels || !this.bufferCtx || !this.bufferCanvas) {
      return;
    }

    const sphereCount = clamp(
      Math.floor(params.sphereCount ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.sphereCount),
      4,
      MAX_SPHERES
    );
    const depthRange = Math.max(1, params.depthRange ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.depthRange);
    const audioReact = clamp(params.audioReact ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.audioReact, 0, 1);
    const bassReverse = clamp(params.bassReverse ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.bassReverse, 0, 1);

    const foldAudioBoost = 1 + audioReact * (audio.rms * 0.75 + audio.bass * 0.5);

    this.updateSphereField(this.sphereDataNow, time, sphereCount, audio.rms * audioReact);

    const palette = getTpiPalette(params.palette ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.palette);
    const aspect = internalW / internalH;
    const invW = 1 / internalW;
    const invH = 1 / internalH;

    const pocketX = 0.5 + Math.sin(time * 0.23) * 0.24;
    const pocketY = 0.5 + Math.cos(time * 0.19) * 0.18;

    for (let y = 0; y < internalH; y += 1) {
      const ny = ((y + 0.5) * invH - 0.5) * 2;
      for (let x = 0; x < internalW; x += 1) {
        const nx = (((x + 0.5) * invW - 0.5) * 2) * aspect;

        const rayLen = Math.hypot(nx, ny, -1.15) || 1;
        const dx = nx / rayLen;
        const dy = ny / rayLen;
        const dz = -1.15 / rayLen;

        const proxyDepth = this.estimateDepthProxy(dx, dy, dz, sphereCount, time);
        const depthNorm = clamp(proxyDepth / depthRange, 0, 1);

        const deltaTBase = depthToDeltaT(
          depthNorm,
          {
            timeScale: params.timeScale ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.timeScale,
            depthGamma: params.depthGamma ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.depthGamma,
            allowLead: params.allowLead ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.allowLead,
            foldAmount: (params.foldAmount ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.foldAmount) * foldAudioBoost,
            foldFreq: params.foldFreq ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.foldFreq,
            foldSpeed: params.foldSpeed ?? TEMPORAL_PARALLAX_INVERSION_DEFAULTS.foldSpeed,
          },
          time
        );

        const pocketDistance = Math.hypot((x * invW - pocketX) * 1.35, (y * invH - pocketY) * 1.4);
        const pocketMask = clamp(1 - pocketDistance / 0.25, 0, 1);
        const reverseStrength = audio.bass * bassReverse * (0.35 + audioReact * 0.65);
        const deltaT = deltaTBase * (1 - 2 * reverseStrength * pocketMask * pocketMask);

        const tSample = time - deltaT;
        const color = this.traceScene(dx, dy, dz, sphereCount, tSample, depthRange, palette, depthNorm);
        const idx = (y * internalW + x) * 4;
        this.pixels[idx] = color[0];
        this.pixels[idx + 1] = color[1];
        this.pixels[idx + 2] = color[2];
        this.pixels[idx + 3] = 255;
      }
    }

    this.bufferCtx.putImageData(this.imageData, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.bufferCanvas, 0, 0, width, height);
    ctx.restore();
  }

  private ensureBuffer(width: number, height: number): void {
    if (!this.bufferCanvas) {
      this.bufferCanvas = document.createElement("canvas");
      this.bufferCtx = this.bufferCanvas.getContext("2d");
    }
    if (!this.bufferCanvas || !this.bufferCtx) {
      return;
    }
    if (width === this.bufW && height === this.bufH && this.imageData && this.pixels) {
      return;
    }

    this.bufferCanvas.width = width;
    this.bufferCanvas.height = height;
    this.bufW = width;
    this.bufH = height;
    this.imageData = this.bufferCtx.createImageData(width, height);
    this.pixels = this.imageData.data;
  }

  private updateSphereField(target: Float32Array, time: number, sphereCount: number, energy: number): void {
    for (let i = 0; i < sphereCount; i += 1) {
      const base = i * 7;
      const fi = i + 1;
      const group = i % 3;
      const orbit = 1.7 + group * 0.85;
      const spin = time * (0.3 + fi * 0.023);
      const bob = time * (0.7 + fi * 0.031);
      const depthWave = Math.sin(time * (0.24 + fi * 0.017));
      const twist = Math.sin(time * 0.35 + fi * 1.13) * 0.45;

      target[base] = Math.sin(spin + fi * 0.9) * orbit + Math.sin(time * 0.55 + fi) * 0.2;
      target[base + 1] = Math.cos(bob + fi * 0.73) * (0.8 + group * 0.35) + Math.sin(spin * 0.75) * 0.4;
      target[base + 2] = -5.5 - group * 1.5 - depthWave * 1.2 + twist;

      const pulse = Math.sin(time * 1.8 + fi * 2.1) * 0.08;
      target[base + 3] = 0.65 + (i % 4) * 0.07 + pulse + energy * 0.1;
      target[base + 4] = (i % 5) / 4;
      target[base + 5] = 0.3 + ((i * 37) % 100) / 100;
      target[base + 6] = Math.sin(time * (0.4 + fi * 0.03) + fi * 0.37);
    }
  }

  private estimateDepthProxy(dx: number, dy: number, dz: number, sphereCount: number, time: number): number {
    let nearest = 64;
    const active = Math.min(6, sphereCount);

    for (let i = 0; i < active; i += 1) {
      const base = i * 7;
      const cx = this.sphereDataNow[base] * 0.85;
      const cy = this.sphereDataNow[base + 1] * 0.85;
      const cz = this.sphereDataNow[base + 2] + Math.sin(time * 0.1 + i) * 0.25;
      const radius = this.sphereDataNow[base + 3] * 0.85;
      const hit = this.intersectSphere(0, 0, 0, dx, dy, dz, cx, cy, cz, radius);
      if (hit !== null && hit < nearest) {
        nearest = hit;
      }
    }

    return nearest;
  }

  private traceScene(
    dx: number,
    dy: number,
    dz: number,
    sphereCount: number,
    tSample: number,
    depthRange: number,
    palette: Palette,
    fallbackDepthNorm: number
  ): [number, number, number] {
    let nearest = Infinity;
    let hitSphere = -1;
    for (let i = 0; i < sphereCount; i += 1) {
      const hit = this.intersectSphere(
        0,
        0,
        0,
        dx,
        dy,
        dz,
        this.evalSphereX(i, tSample),
        this.evalSphereY(i, tSample),
        this.evalSphereZ(i, tSample),
        this.evalSphereR(i, tSample, 0)
      );
      if (hit !== null && hit < nearest) {
        nearest = hit;
        hitSphere = i;
      }
    }

    if (hitSphere < 0 || !Number.isFinite(nearest)) {
      const sky = clamp(0.5 - dy * 0.5, 0, 1);
      const shimmer = 0.5 + 0.5 * Math.sin((dx * 2.5 + dy * 2.1 + tSample * 0.8) * TAU * 0.35);
      return [
        Math.round(lerp(palette.backgroundBottom[0], palette.backgroundTop[0], sky) + shimmer * 8),
        Math.round(lerp(palette.backgroundBottom[1], palette.backgroundTop[1], sky) + shimmer * 10),
        Math.round(lerp(palette.backgroundBottom[2], palette.backgroundTop[2], sky) + shimmer * 16),
      ];
    }

    const cx = this.evalSphereX(hitSphere, tSample);
    const cy = this.evalSphereY(hitSphere, tSample);
    const cz = this.evalSphereZ(hitSphere, tSample);

    const px = dx * nearest;
    const py = dy * nearest;
    const pz = dz * nearest;

    const nx = px - cx;
    const ny = py - cy;
    const nz = pz - cz;
    const nLen = Math.hypot(nx, ny, nz) || 1;
    const nnx = nx / nLen;
    const nny = ny / nLen;
    const nnz = nz / nLen;

    const ldx = Math.sin(tSample * 0.9) * 0.6;
    const ldy = 0.5 + Math.cos(tSample * 0.6) * 0.35;
    const ldz = 0.4 + Math.sin(tSample * 0.42) * 0.4;
    const lLen = Math.hypot(ldx, ldy, ldz) || 1;
    const lx = ldx / lLen;
    const ly = ldy / lLen;
    const lz = ldz / lLen;

    const diffuse = Math.max(0, nnx * lx + nny * ly + nnz * lz);
    const vx = -dx;
    const vy = -dy;
    const vz = -dz;
    const vLen = Math.hypot(vx, vy, vz) || 1;
    const vxn = vx / vLen;
    const vyn = vy / vLen;
    const vzn = vz / vLen;

    const dotNL = nnx * lx + nny * ly + nnz * lz;
    const rx = 2 * dotNL * nnx - lx;
    const ry = 2 * dotNL * nny - ly;
    const rz = 2 * dotNL * nnz - lz;
    const specBase = Math.max(0, rx * vxn + ry * vyn + rz * vzn);
    const flicker = 0.7 + 0.3 * Math.sin((Math.sin(tSample * (0.4 + (hitSphere + 1) * 0.03) + (hitSphere + 1) * 0.37) + tSample * 1.7) * TAU);
    const specular = Math.pow(specBase, 28) * flicker;

    const hueMix = (hitSphere % 5) / 4;
    const baseR = lerp(palette.sphereA[0], palette.sphereB[0], hueMix);
    const baseG = lerp(palette.sphereA[1], palette.sphereB[1], hueMix);
    const baseB = lerp(palette.sphereA[2], palette.sphereB[2], hueMix);

    const depthNorm = clamp(nearest / depthRange, 0, 1);
    const fog = Math.max(depthNorm, fallbackDepthNorm * 0.6);
    const rim = Math.pow(1 - Math.max(0, nnx * vxn + nny * vyn + nnz * vzn), 2.5);

    const litR = baseR * (0.2 + diffuse * 0.9) + specular * 255 * 0.5 + rim * palette.rim[0] * 0.35;
    const litG = baseG * (0.2 + diffuse * 0.9) + specular * 255 * 0.45 + rim * palette.rim[1] * 0.35;
    const litB = baseB * (0.2 + diffuse * 0.9) + specular * 255 * 0.65 + rim * palette.rim[2] * 0.45;

    return [
      Math.round(lerp(litR, palette.fog[0], fog * 0.7)),
      Math.round(lerp(litG, palette.fog[1], fog * 0.7)),
      Math.round(lerp(litB, palette.fog[2], fog * 0.7)),
    ];
  }


  private evalSphereX(index: number, time: number): number {
    const fi = index + 1;
    const group = index % 3;
    const orbit = 1.7 + group * 0.85;
    const spin = time * (0.3 + fi * 0.023);
    return Math.sin(spin + fi * 0.9) * orbit + Math.sin(time * 0.55 + fi) * 0.2;
  }

  private evalSphereY(index: number, time: number): number {
    const fi = index + 1;
    const group = index % 3;
    const spin = time * (0.3 + fi * 0.023);
    const bob = time * (0.7 + fi * 0.031);
    return Math.cos(bob + fi * 0.73) * (0.8 + group * 0.35) + Math.sin(spin * 0.75) * 0.4;
  }

  private evalSphereZ(index: number, time: number): number {
    const fi = index + 1;
    const group = index % 3;
    const depthWave = Math.sin(time * (0.24 + fi * 0.017));
    const twist = Math.sin(time * 0.35 + fi * 1.13) * 0.45;
    return -5.5 - group * 1.5 - depthWave * 1.2 + twist;
  }

  private evalSphereR(index: number, time: number, energy: number): number {
    const fi = index + 1;
    const pulse = Math.sin(time * 1.8 + fi * 2.1) * 0.08;
    return 0.65 + (index % 4) * 0.07 + pulse + energy * 0.1;
  }

  private intersectSphere(
    ox: number,
    oy: number,
    oz: number,
    dx: number,
    dy: number,
    dz: number,
    cx: number,
    cy: number,
    cz: number,
    radius: number
  ): number | null {
    const ocx = ox - cx;
    const ocy = oy - cy;
    const ocz = oz - cz;
    const b = ocx * dx + ocy * dy + ocz * dz;
    const c = ocx * ocx + ocy * ocy + ocz * ocz - radius * radius;
    const h = b * b - c;
    if (h < 0) {
      return null;
    }
    const root = Math.sqrt(h);
    const near = -b - root;
    if (near > EPSILON) {
      return near;
    }
    const far = -b + root;
    if (far > EPSILON) {
      return far;
    }
    return null;
  }
}
