import { clamp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const hashFloat = (value: number): number => {
  const hashed = Math.sin(value) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const fract = (value: number): number => value - Math.floor(value);

const seasonalWindow = (season: number, start: number, peak: number, end: number): number => {
  if (season <= start || season >= end) {
    return 0;
  }
  if (season < peak) {
    return smoothstep(start, peak, season);
  }
  return 1 - smoothstep(peak, end, season);
};

type SeasonState = {
  leafPresence: number;
  blossomAmount: number;
  autumnAmount: number;
  winterAmount: number;
  fallenLeafAmount: number;
  branchFlex: number;
};

type TreeSegment = {
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  depth: number;
  branchId: number;
};

type TreeModel = {
  segments: TreeSegment[];
  leafTips: TreeSegment[];
  maxDepth: number;
};

const getSeasonState = (season: number): SeasonState => {
  const springBurst = seasonalWindow(season, 0.08, 0.22, 0.38);
  const autumnShift = seasonalWindow(season, 0.56, 0.74, 0.94);
  const winterAmount = Math.max(
    seasonalWindow(season, -0.05, 0.02, 0.14),
    seasonalWindow(season, 0.88, 0.98, 1.08)
  );

  const summerHold = clamp01(1 - autumnShift * 0.85);
  const leafPresence = clamp01(springBurst * 1.15 + summerHold * 0.95 - winterAmount * 1.15);

  return {
    leafPresence,
    blossomAmount: springBurst * (1 - autumnShift) * (1 - winterAmount),
    autumnAmount: autumnShift * (1 - winterAmount * 0.7),
    winterAmount,
    fallenLeafAmount: clamp01(autumnShift * 1.1 + winterAmount * 0.3),
    branchFlex: mix(0.14, 0.25, springBurst * 0.45 + autumnShift * 0.25)
  };
};

const buildHsla = (hue: number, saturation: number, lightness: number, alpha: number): string =>
  `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

export class TreeGrowthEffect implements Effect {
  private cycleStartTime: number | null = null;
  private model: TreeModel | null = null;
  private modelSignature: string | null = null;

  reset(): void {
    this.cycleStartTime = null;
    this.model = null;
    this.modelSignature = null;
  }

  private ensureModel(options: {
    trunkHeight: number;
    branchScale: number;
    branchAngleDeg: number;
    jitter: number;
    seed: number;
    levels: number;
    height: number;
  }): TreeModel {
    const signature = [
      options.trunkHeight,
      options.branchScale,
      options.branchAngleDeg,
      options.jitter,
      options.seed,
      options.levels,
      options.height
    ]
      .map((value) => value.toFixed(4))
      .join("|");

    if (this.model && this.modelSignature === signature) {
      return this.model;
    }

    const spread = (options.branchAngleDeg * Math.PI) / 180;
    const segments: TreeSegment[] = [];
    const leafTips: TreeSegment[] = [];

    const build = (x: number, y: number, length: number, angle: number, depth: number, branchId: number): void => {
      if (depth >= options.levels) {
        return;
      }

      const bendDir = hashFloat(options.seed + branchId * 4.73) - 0.5;
      const bend = (0.1 + options.jitter * 0.35) * bendDir;
      const endX = x + Math.cos(angle) * length;
      const endY = y - Math.sin(angle) * length;
      const controlX = x + Math.cos(angle) * length * 0.52 + Math.cos(angle - Math.PI / 2) * length * bend;
      const controlY = y - Math.sin(angle) * length * 0.52 - Math.sin(angle - Math.PI / 2) * length * bend;

      const segment: TreeSegment = {
        startX: x,
        startY: y,
        controlX,
        controlY,
        endX,
        endY,
        depth,
        branchId
      };
      segments.push(segment);

      if (depth >= options.levels - 2) {
        leafTips.push(segment);
      }

      const localSpread = spread * mix(0.9, 1.12, hashFloat(options.seed + branchId * 2.71));
      const varianceA = (hashFloat(options.seed + branchId * 1.37) - 0.5) * 2 * localSpread * options.jitter;
      const varianceB = (hashFloat(options.seed + branchId * 2.91) - 0.5) * 2 * localSpread * options.jitter;
      const scaleA = options.branchScale * (0.88 + hashFloat(options.seed + branchId * 5.11) * 0.16);
      const scaleB = options.branchScale * (0.88 + hashFloat(options.seed + branchId * 7.77) * 0.16);

      build(endX, endY, length * scaleA, angle + localSpread + varianceA, depth + 1, branchId * 2);
      build(endX, endY, length * scaleB, angle - localSpread + varianceB, depth + 1, branchId * 2 + 1);

      const hasSprig = depth >= 1 && depth <= options.levels - 3 && hashFloat(options.seed + branchId * 9.13) > 0.39;
      if (hasSprig) {
        const sprigDirection = hashFloat(options.seed + branchId * 11.3) > 0.5 ? 1 : -1;
        const sprigAngle = angle + sprigDirection * localSpread * mix(0.2, 0.35, hashFloat(options.seed + branchId * 1.11));
        const sprigScale = options.branchScale * (0.5 + hashFloat(options.seed + branchId * 6.3) * 0.1);
        build(endX, endY, length * sprigScale, sprigAngle, depth + 1, branchId * 3 + 17);
      }
    };

    build(0, 0, options.height * options.trunkHeight, Math.PI / 2, 0, 1);

    this.model = {
      segments,
      leafTips,
      maxDepth: Math.max(1, options.levels - 1)
    };
    this.modelSignature = signature;
    return this.model;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const speed = Math.max(0, resolveNumberParam(rawParams.speed, 0.12));
    const levels = clamp(Math.round(resolveNumberParam(rawParams.levels, 8)), 4, 10);
    const trunkHeight = clamp(resolveNumberParam(rawParams.trunkHeight, 0.52), 0.25, 0.72);
    const branchScale = clamp(resolveNumberParam(rawParams.branchScale, 0.69), 0.45, 0.86);
    const branchAngleDeg = clamp(resolveNumberParam(rawParams.branchAngle, 23), 8, 55);
    const trunkWidth = clamp(resolveNumberParam(rawParams.trunkWidth, 8), 2, 24);
    const sway = clamp(resolveNumberParam(rawParams.sway, 0.22), 0, 1.2);
    const leafSize = clamp(resolveNumberParam(rawParams.leafSize, 2.2), 0, 10);
    const jitter = clamp(resolveNumberParam(rawParams.jitter, 0.16), 0, 0.65);
    const seed = resolveNumberParam(rawParams.seed, 0);
    const growthOverride = resolveNumberParam(rawParams.growth, -1);

    if (this.cycleStartTime === null) {
      this.cycleStartTime = time;
    }

    const elapsed = Math.max(0, time - this.cycleStartTime);
    const yearClock = elapsed * Math.max(speed, 0.01);
    const season = fract(yearClock);
    const ageYears = yearClock;
    const ageProgress = clamp01(ageYears / 8);
    const seasonState = getSeasonState(season);

    const structuralGrowth =
      growthOverride >= 0
        ? clamp(growthOverride, 0, 1)
        : clamp01(smoothstep(0, 1, Math.min(1, ageProgress * 1.05)));

    if (structuralGrowth <= 0.001) {
      return;
    }

    const model = this.ensureModel({
      trunkHeight,
      branchScale,
      branchAngleDeg,
      jitter,
      seed,
      levels,
      height
    });

    const skyLight = mix(8, 17, 1 - seasonState.winterAmount * 0.52 + seasonState.blossomAmount * 0.06);
    ctx.fillStyle = buildHsla(214 - seasonState.autumnAmount * 12, 22, skyLight, 0.35);
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = buildHsla(135 - seasonState.autumnAmount * 30, 20, mix(9, 14, seasonState.fallenLeafAmount), 0.32);
    ctx.fillRect(0, height * 0.82, width, height * 0.18);

    ctx.save();
    ctx.translate(width / 2, height * 0.92);
    ctx.lineCap = "round";

    const branchAlpha = mix(0.76, 0.92, clamp01(audio.rms * 1.6 + 0.08));
    const baseSway = Math.sin(time * 0.26 + seed * 0.71) * sway * (0.14 + audio.bass * 0.25 + seasonState.branchFlex);
    const visibleDepth = Math.max(1, Math.floor(1 + structuralGrowth * model.maxDepth));

    for (const segment of model.segments) {
      if (segment.depth > visibleDepth) {
        continue;
      }

      const progressInDepth = clamp01(structuralGrowth * model.maxDepth - segment.depth);
      if (progressInDepth <= 0) {
        continue;
      }

      const swayScale = segment.depth / Math.max(1, model.maxDepth);
      const swayX = Math.cos(segment.depth + segment.branchId * 0.031) * baseSway * 12 * swayScale;
      const swayY = Math.sin(segment.depth + segment.branchId * 0.021) * baseSway * 7 * swayScale;
      const barkHue = mix(26, 18, seasonState.winterAmount * 0.7 + seasonState.autumnAmount * 0.25);
      const barkLight = mix(24, 37, segment.depth / model.maxDepth) + audio.rms * 3;
      const thickness = Math.max(0.45, trunkWidth * Math.pow(0.62, segment.depth) * (0.55 + progressInDepth * 0.45));

      ctx.strokeStyle = buildHsla(barkHue, 26, barkLight, branchAlpha);
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(segment.startX + swayX * 0.2, segment.startY + swayY * 0.2);
      ctx.quadraticCurveTo(
        segment.controlX + swayX * 0.45,
        segment.controlY + swayY * 0.45,
        segment.endX + swayX,
        segment.endY + swayY
      );
      ctx.stroke();
    }

    const leafDensity = seasonState.leafPresence;
    if (leafSize > 0 && leafDensity > 0.015) {
      for (const tip of model.leafTips) {
        if (tip.depth > visibleDepth + 1) {
          continue;
        }

        const seedBase = seed + tip.branchId * 2.13;
        const clusterCount = 2 + Math.round(hashFloat(seedBase + 0.7) * 3);
        for (let index = 0; index < clusterCount; index += 1) {
          const petalJitter = hashFloat(seedBase + index * 1.37);
          const orbit = hashFloat(seedBase + index * 2.17) * Math.PI * 2;
          const distance = leafSize * (0.45 + petalJitter * 0.9);
          const radius = leafSize * (0.38 + petalJitter * 0.32) * (0.5 + leafDensity * 0.65);
          const leafHue = mix(106, 30, seasonState.autumnAmount);
          const blossomHue = mix(336, 20, petalJitter * 0.35);
          const hue = mix(leafHue, blossomHue, seasonState.blossomAmount * (0.5 + petalJitter * 0.35));
          const saturation = mix(25, 66, leafDensity * 0.88 + seasonState.blossomAmount * 0.24);
          const lightness = mix(50, 75, seasonState.blossomAmount * 0.62 + seasonState.autumnAmount * 0.2 + petalJitter * 0.08);
          const alpha = 0.22 + leafDensity * 0.35 + audio.treble * 0.07;

          ctx.fillStyle = buildHsla(hue, saturation, lightness, alpha);
          ctx.beginPath();
          ctx.arc(tip.endX + Math.cos(orbit) * distance, tip.endY + Math.sin(orbit) * distance * 0.72, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (seasonState.fallenLeafAmount > 0.03 && leafSize > 0) {
      const fallenCount = 8 + Math.round(seasonState.fallenLeafAmount * 18 + structuralGrowth * 8);
      for (let index = 0; index < fallenCount; index += 1) {
        const scatter = hashFloat(seed * 2.1 + index * 0.73);
        const x = mix(-width * 0.34, width * 0.34, scatter);
        const y = mix(height * 0.005, height * 0.08, hashFloat(seed + index * 3.17));
        const radius = leafSize * (0.2 + hashFloat(seed + index * 4.1) * 0.28);
        const hue = mix(30, 12, hashFloat(seed + index * 1.9) * 0.34);
        ctx.fillStyle = buildHsla(hue, 66, 50, 0.12 + seasonState.fallenLeafAmount * 0.16);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
