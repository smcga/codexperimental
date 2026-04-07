import { clamp, smoothstep } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

const resolveNumberParam = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const mix = (from: number, to: number, amount: number): number => from + (to - from) * amount;

const clamp01 = (value: number): number => clamp(value, 0, 1);

const fract = (value: number): number => value - Math.floor(value);

const hashFloat = (value: number): number => {
  const hashed = Math.sin(value * 12.9898 + 78.233) * 43758.5453123;
  return hashed - Math.floor(hashed);
};

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
  controlAX: number;
  controlAY: number;
  controlBX: number;
  controlBY: number;
  endX: number;
  endY: number;
  depth: number;
  branchId: number;
  bornAt: number;
  maturity: number;
};

type TreeModel = {
  segments: TreeSegment[];
  tipSegments: TreeSegment[];
  maxDepth: number;
};

const getSeasonState = (season: number): SeasonState => {
  const springBurst = seasonalWindow(season, 0.07, 0.2, 0.36);
  const autumnShift = seasonalWindow(season, 0.54, 0.72, 0.93);
  const winterAmount = Math.max(seasonalWindow(season, -0.06, 0.03, 0.15), seasonalWindow(season, 0.86, 0.98, 1.08));

  const summerHold = clamp01(1 - autumnShift * 0.82);
  const leafPresence = clamp01(springBurst * 1.16 + summerHold * 0.97 - winterAmount * 1.2);

  return {
    leafPresence,
    blossomAmount: springBurst * (1 - autumnShift) * (1 - winterAmount),
    autumnAmount: autumnShift * (1 - winterAmount * 0.72),
    winterAmount,
    fallenLeafAmount: clamp01(autumnShift * 1.12 + winterAmount * 0.28),
    branchFlex: mix(0.1, 0.24, springBurst * 0.45 + autumnShift * 0.34)
  };
};

const hsla = (hue: number, saturation: number, lightness: number, alpha: number): string =>
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

    const addSegment = (
      x: number,
      y: number,
      length: number,
      angle: number,
      depth: number,
      branchId: number,
      bornAt: number,
      maturity: number
    ): TreeSegment => {
      const bendSeed = hashFloat(options.seed * 0.37 + branchId * 1.93) - 0.5;
      const bend = bendSeed * (0.09 + options.jitter * 0.33);
      const endX = x + Math.cos(angle) * length;
      const endY = y - Math.sin(angle) * length;
      const tangentX = Math.cos(angle);
      const tangentY = -Math.sin(angle);
      const normalX = Math.cos(angle - Math.PI / 2);
      const normalY = -Math.sin(angle - Math.PI / 2);
      const controlAX = x + tangentX * length * 0.32 + normalX * length * bend * 0.45;
      const controlAY = y + tangentY * length * 0.32 + normalY * length * bend * 0.45;
      const controlBX = x + tangentX * length * 0.78 + normalX * length * bend;
      const controlBY = y + tangentY * length * 0.78 + normalY * length * bend;

      const segment: TreeSegment = {
        startX: x,
        startY: y,
        controlAX,
        controlAY,
        controlBX,
        controlBY,
        endX,
        endY,
        depth,
        branchId,
        bornAt,
        maturity
      };
      segments.push(segment);
      return segment;
    };

    const build = (
      x: number,
      y: number,
      length: number,
      angle: number,
      depth: number,
      branchId: number,
      bornAt: number,
      maturity: number
    ): void => {
      if (depth >= options.levels || length < 2) {
        return;
      }

      const parent = addSegment(x, y, length, angle, depth, branchId, bornAt, maturity);
      const childProgressBase = bornAt + 0.095 + depth * 0.015;
      const childMaturity = Math.max(0.06, maturity * 0.83);
      const localSpread = spread * mix(0.88, 1.13, hashFloat(options.seed + branchId * 2.17));
      const jitterAmp = localSpread * options.jitter;

      const leftVariance = (hashFloat(options.seed + branchId * 1.31) - 0.5) * jitterAmp * 2;
      const rightVariance = (hashFloat(options.seed + branchId * 2.41) - 0.5) * jitterAmp * 2;
      const leftScale = options.branchScale * (0.87 + hashFloat(options.seed + branchId * 4.11) * 0.18);
      const rightScale = options.branchScale * (0.87 + hashFloat(options.seed + branchId * 5.91) * 0.18);

      build(parent.endX, parent.endY, length * leftScale, angle + localSpread + leftVariance, depth + 1, branchId * 2, childProgressBase, childMaturity);
      build(
        parent.endX,
        parent.endY,
        length * rightScale,
        angle - localSpread + rightVariance,
        depth + 1,
        branchId * 2 + 1,
        childProgressBase + 0.012,
        childMaturity
      );

      const sprouts = depth >= 1 && depth <= options.levels - 3 ? 1 : 0;
      if (sprouts > 0 && hashFloat(options.seed + branchId * 8.03) > 0.36) {
        const dir = hashFloat(options.seed + branchId * 7.17) > 0.5 ? 1 : -1;
        const sproutAngle = angle + dir * localSpread * mix(0.17, 0.32, hashFloat(options.seed + branchId * 3.53));
        const sproutScale = options.branchScale * (0.44 + hashFloat(options.seed + branchId * 6.79) * 0.13);
        build(
          parent.endX,
          parent.endY,
          length * sproutScale,
          sproutAngle,
          depth + 1,
          branchId * 3 + 19,
          childProgressBase + 0.04,
          childMaturity * 0.8
        );
      }
    };

    build(0, 0, options.height * options.trunkHeight, Math.PI / 2, 0, 1, 0, 0.18);
    const tipSegments = segments.filter((segment) => segment.depth >= options.levels - 3);

    this.model = {
      segments,
      tipSegments,
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

    if (this.cycleStartTime === null) {
      this.cycleStartTime = time;
    }

    const elapsed = Math.max(0, time - this.cycleStartTime);
    const yearClock = elapsed * Math.max(speed, 0.01);
    const season = fract(yearClock);
    const ageYears = yearClock;
    const ageProgress = clamp01(ageYears / 8);
    const seasonState = getSeasonState(season);

    const structuralGrowth = clamp01(smoothstep(0, 1, Math.min(1, ageProgress * 1.08)));

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

    const skyLight = mix(7, 17, 1 - seasonState.winterAmount * 0.58 + seasonState.blossomAmount * 0.08);
    const skyHue = mix(215, 202, seasonState.blossomAmount * 0.25 + seasonState.winterAmount * 0.14);
    ctx.fillStyle = hsla(skyHue, 26, skyLight, 0.36);
    ctx.fillRect(0, 0, width, height);

    const groundLight = mix(8.5, 15.5, seasonState.fallenLeafAmount * 0.66 + seasonState.blossomAmount * 0.12);
    ctx.fillStyle = hsla(122 - seasonState.autumnAmount * 48, 23, groundLight, 0.34);
    ctx.fillRect(0, height * 0.8, width, height * 0.2);

    ctx.save();
    ctx.translate(width / 2, height * 0.92);
    ctx.lineCap = "round";

    const branchAlpha = mix(0.76, 0.94, clamp01(audio.rms * 1.5 + 0.1));
    const baseSway = Math.sin(time * 0.27 + seed * 0.67) * sway * (0.12 + audio.bass * 0.26 + seasonState.branchFlex);

    let visibleBranches = 0;
    for (const segment of model.segments) {
      const bornEase = smoothstep(segment.bornAt, segment.bornAt + segment.maturity, structuralGrowth);
      if (bornEase <= 0.001) {
        continue;
      }

      visibleBranches += 1;
      const swayScale = segment.depth / Math.max(1, model.maxDepth);
      const swayX = Math.cos(segment.branchId * 0.061 + segment.depth * 0.41) * baseSway * 12 * swayScale;
      const swayY = Math.sin(segment.branchId * 0.049 + segment.depth * 0.37) * baseSway * 7 * swayScale;

      const barkHue = mix(26, 17, seasonState.winterAmount * 0.74 + seasonState.autumnAmount * 0.33);
      const barkLight = mix(22, 39, segment.depth / model.maxDepth) + audio.rms * 3;
      const thickness = Math.max(0.45, trunkWidth * Math.pow(0.64, segment.depth) * (0.4 + bornEase * 0.75));

      ctx.strokeStyle = hsla(barkHue, 28, barkLight, branchAlpha);
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(segment.startX + swayX * 0.18, segment.startY + swayY * 0.18);
      ctx.bezierCurveTo(
        segment.controlAX + swayX * 0.45,
        segment.controlAY + swayY * 0.45,
        segment.controlBX + swayX * 0.7,
        segment.controlBY + swayY * 0.7,
        segment.endX + swayX,
        segment.endY + swayY
      );
      ctx.stroke();

      if (segment.depth <= 1) {
        const highlight = 0.17 + bornEase * 0.12;
        ctx.strokeStyle = hsla(31, 38, 52, highlight);
        ctx.lineWidth = Math.max(0.5, thickness * 0.22);
        ctx.beginPath();
        ctx.moveTo(segment.startX + swayX * 0.11 - thickness * 0.1, segment.startY + swayY * 0.11);
        ctx.bezierCurveTo(
          segment.controlAX + swayX * 0.3,
          segment.controlAY + swayY * 0.3,
          segment.controlBX + swayX * 0.54,
          segment.controlBY + swayY * 0.54,
          segment.endX + swayX * 0.8,
          segment.endY + swayY * 0.8
        );
        ctx.stroke();
      }
    }

    const canopyReadiness = smoothstep(0.34, 0.76, structuralGrowth);
    const leafDensity = seasonState.leafPresence * canopyReadiness;
    if (leafSize > 0 && leafDensity > 0.012) {
      for (const tip of model.tipSegments) {
        const bornEase = smoothstep(tip.bornAt, tip.bornAt + tip.maturity, structuralGrowth);
        if (bornEase <= 0.001) {
          continue;
        }

        const clusterSeed = seed + tip.branchId * 1.73;
        const clusterCount = 2 + Math.floor(hashFloat(clusterSeed + 0.4) * 4);

        for (let index = 0; index < clusterCount; index += 1) {
          const n = hashFloat(clusterSeed + index * 1.29);
          const orbit = hashFloat(clusterSeed + index * 2.03) * Math.PI * 2;
          const distance = leafSize * (0.38 + n * 1.18) * (0.66 + bornEase * 0.34);
          const radius = leafSize * (0.22 + n * 0.46) * (0.35 + leafDensity * 0.85) * (0.65 + bornEase * 0.35);

          const leafHue = mix(108, 23, seasonState.autumnAmount);
          const blossomHue = mix(340, 20, n * 0.4);
          const hue = mix(leafHue, blossomHue, seasonState.blossomAmount * (0.45 + n * 0.45));
          const saturation = mix(28, 68, leafDensity * 0.84 + seasonState.blossomAmount * 0.3);
          const lightness = mix(48, 78, seasonState.blossomAmount * 0.64 + seasonState.autumnAmount * 0.24 + n * 0.09);
          const alpha = 0.18 + leafDensity * 0.32 + audio.treble * 0.06;

          const px = tip.endX + Math.cos(orbit) * distance;
          const py = tip.endY + Math.sin(orbit) * distance * 0.72;

          ctx.fillStyle = hsla(hue, saturation, lightness, alpha);
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fill();

          if (seasonState.blossomAmount > 0.1 && n > 0.6) {
            ctx.fillStyle = hsla(12, 36, 96, 0.23 * seasonState.blossomAmount);
            ctx.beginPath();
            ctx.arc(px - radius * 0.22, py - radius * 0.24, radius * 0.38, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    if (seasonState.fallenLeafAmount > 0.02 && leafSize > 0) {
      const fallenCount = 8 + Math.round(seasonState.fallenLeafAmount * 20 + structuralGrowth * 10);
      for (let index = 0; index < fallenCount; index += 1) {
        const scatter = hashFloat(seed * 2.1 + index * 0.73);
        const x = mix(-width * 0.34, width * 0.34, scatter);
        const y = mix(height * 0.008, height * 0.086, hashFloat(seed + index * 3.17));
        const radius = leafSize * (0.14 + hashFloat(seed + index * 4.1) * 0.33);
        const hue = mix(31, 10, hashFloat(seed + index * 1.9) * 0.44);
        ctx.fillStyle = hsla(hue, 65, 49, 0.11 + seasonState.fallenLeafAmount * 0.18);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const yearMarkers = Math.max(0, Math.floor(ageYears));
    if (yearMarkers > 0) {
      const ringCount = Math.min(7, yearMarkers);
      for (let index = 0; index < ringCount; index += 1) {
        const ageRatio = (index + 1) / (ringCount + 1);
        const radius = mix(2.3, trunkWidth * 1.42, ageRatio) * (0.55 + structuralGrowth * 0.45);
        ctx.strokeStyle = hsla(30, 35, mix(28, 48, ageRatio), 0.11 + ageRatio * 0.08);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (visibleBranches > 0) {
      const shadowRadius = mix(trunkWidth * 1.8, trunkWidth * 3.6, clamp01(visibleBranches / model.segments.length));
      const shadowAlpha = 0.13 + 0.09 * structuralGrowth;
      ctx.fillStyle = hsla(22, 22, 6, shadowAlpha);
      ctx.beginPath();
      ctx.ellipse(0, height * 0.045, shadowRadius * 2.2, shadowRadius * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
