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
    branchFlex: mix(0.16, 0.32, springBurst * 0.45 + autumnShift * 0.25)
  };
};

const buildHsla = (hue: number, saturation: number, lightness: number, alpha: number): string =>
  `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

export class TreeGrowthEffect implements Effect {
  private cycleStartTime: number | null = null;

  reset(): void {
    this.cycleStartTime = null;
  }

  render({ ctx, width, height, time, audio, params }: EffectRenderContext): void {
    const rawParams = params as Record<string, unknown>;
    const speed = Math.max(0, resolveNumberParam(rawParams.speed, 0.18));
    const levels = clamp(Math.round(resolveNumberParam(rawParams.levels, 8)), 4, 10);
    const trunkHeight = clamp(resolveNumberParam(rawParams.trunkHeight, 0.52), 0.25, 0.72);
    const branchScale = clamp(resolveNumberParam(rawParams.branchScale, 0.69), 0.45, 0.86);
    const branchAngleDeg = clamp(resolveNumberParam(rawParams.branchAngle, 23), 8, 55);
    const trunkWidth = clamp(resolveNumberParam(rawParams.trunkWidth, 8), 2, 24);
    const sway = clamp(resolveNumberParam(rawParams.sway, 0.26), 0, 1.2);
    const leafSize = clamp(resolveNumberParam(rawParams.leafSize, 2.4), 0, 10);
    const jitter = clamp(resolveNumberParam(rawParams.jitter, 0.18), 0, 0.65);
    const seed = resolveNumberParam(rawParams.seed, 0);
    const growthOverride = resolveNumberParam(rawParams.growth, -1);

    if (this.cycleStartTime === null) {
      this.cycleStartTime = time;
    }

    const elapsed = Math.max(0, time - this.cycleStartTime);
    const yearClock = elapsed * Math.max(speed, 0.02);
    const season = fract(yearClock);
    const ageYears = yearClock;
    const ageProgress = clamp01(ageYears / 4.5);
    const seasonState = getSeasonState(season);
    const structuralMaturity = growthOverride >= 0 ? clamp(growthOverride, 0, 1) : ageProgress;

    const growth =
      growthOverride >= 0
        ? clamp(growthOverride, 0, 1)
        : clamp01(smoothstep(0, 1, Math.min(1, ageProgress * 1.15)) * (0.2 + 0.8 * smoothstep(0.03, 0.45, season)));

    if (growth <= 0.001) {
      return;
    }

    const skyLight = mix(8, 18, 1 - seasonState.winterAmount * 0.55 + seasonState.blossomAmount * 0.08);
    ctx.fillStyle = buildHsla(216 - seasonState.autumnAmount * 10, 24, skyLight, 0.36);
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = buildHsla(140 - seasonState.autumnAmount * 28, 24, mix(8, 14, seasonState.fallenLeafAmount), 0.38);
    ctx.fillRect(0, height * 0.82, width, height * 0.18);

    ctx.save();
    ctx.translate(width / 2, height * 0.92);
    ctx.lineCap = "round";

    const baseLength = height * trunkHeight;
    const baseSway = Math.sin(time * 0.42 + seed * 0.91) * sway * (0.18 + audio.bass * 0.3 + seasonState.branchFlex);
    const spread = (branchAngleDeg * Math.PI) / 180;
    const levelDelay = 0.08;
    const matureLevels = Math.max(3, Math.round(levels * (0.4 + structuralMaturity * 0.75)));
    const branchAlpha = mix(0.72, 0.92, clamp01(audio.rms * 1.8 + 0.1));

    const drawLeafCluster = (x: number, y: number, branchId: number, depth: number): void => {
      const clusterCount = 2 + Math.round(leafSize * 0.3 + hashFloat(seed + branchId * 2.3) * 2);
      const density = seasonState.leafPresence;
      if (leafSize <= 0 || density <= 0.02) {
        return;
      }

      for (let index = 0; index < clusterCount; index += 1) {
        const petalJitter = hashFloat(seed + branchId * 5.7 + index * 3.13);
        const orbit = hashFloat(seed + branchId * 7.9 + index * 1.17) * Math.PI * 2;
        const distance = (leafSize * 0.65 + depth * 0.12) * (0.45 + petalJitter * 0.9);
        const radius = leafSize * (0.42 + petalJitter * 0.34) * (0.55 + density * 0.55);
        const leafHue = mix(108, 34, seasonState.autumnAmount);
        const blossomHue = mix(332, 18, petalJitter * 0.35);
        const hue = mix(leafHue, blossomHue, seasonState.blossomAmount * (0.55 + petalJitter * 0.35));
        const saturation = mix(22, 68, density * 0.85 + seasonState.blossomAmount * 0.25);
        const lightness = mix(52, 76, seasonState.blossomAmount * 0.65 + seasonState.autumnAmount * 0.18 + petalJitter * 0.08);
        const alpha = 0.24 + density * 0.34 + audio.treble * 0.08;
        ctx.fillStyle = buildHsla(hue, saturation, lightness, alpha);
        ctx.beginPath();
        ctx.arc(x + Math.cos(orbit) * distance, y + Math.sin(orbit) * distance * 0.72, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawFallenLeaves = (): void => {
      if (seasonState.fallenLeafAmount <= 0.02 || leafSize <= 0) {
        return;
      }
      const count = 10 + Math.round(seasonState.fallenLeafAmount * 22 + structuralMaturity * 10);
      for (let index = 0; index < count; index += 1) {
        const scatter = hashFloat(seed * 2.1 + index * 0.73);
        const x = mix(-width * 0.34, width * 0.34, scatter);
        const y = mix(height * 0.005, height * 0.08, hashFloat(seed + index * 3.17));
        const radius = leafSize * (0.28 + hashFloat(seed + index * 4.1) * 0.3);
        const hue = mix(28, 12, hashFloat(seed + index * 1.9) * 0.35);
        ctx.fillStyle = buildHsla(hue, 70, 52, 0.14 + seasonState.fallenLeafAmount * 0.18);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawBranch = (
      x: number,
      y: number,
      length: number,
      angle: number,
      depth: number,
      branchId: number
    ): void => {
      if (depth >= matureLevels) {
        drawLeafCluster(x, y, branchId, depth);
        return;
      }

      const levelCap = Math.max(0.001, 1 - depth * levelDelay);
      const levelProgress = clamp01((growth - depth * levelDelay) / levelCap);
      if (levelProgress <= 0) {
        return;
      }

      const taper = Math.pow(0.61, depth);
      const segment = length * levelProgress;
      const bendDir = hashFloat(seed + branchId * 4.73) - 0.5;
      const bend = (seasonState.branchFlex + jitter * 0.5 + audio.mid * 0.05) * bendDir;
      const endX = x + Math.cos(angle) * segment;
      const endY = y - Math.sin(angle) * segment;
      const controlX = x + Math.cos(angle) * segment * 0.52 + Math.cos(angle - Math.PI / 2) * segment * bend;
      const controlY = y - Math.sin(angle) * segment * 0.52 - Math.sin(angle - Math.PI / 2) * segment * bend;
      const barkHue = mix(26, 18, seasonState.winterAmount * 0.7 + seasonState.autumnAmount * 0.25);
      const barkLight = mix(24, 36, depth / Math.max(1, levels - 1)) + audio.rms * 3;

      ctx.strokeStyle = buildHsla(barkHue, 28, barkLight, branchAlpha);
      ctx.lineWidth = Math.max(0.5, trunkWidth * taper * (1 - depth / (levels * 14)));
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.stroke();

      if (levelProgress < 0.98) {
        if (depth >= matureLevels - 2) {
          drawLeafCluster(endX, endY, branchId, depth);
        }
        return;
      }

      const localSpread = spread * mix(0.88, 1.08, hashFloat(seed + branchId * 2.71));
      const varianceA = (hashFloat(seed + branchId * 1.37) - 0.5) * 2 * localSpread * jitter;
      const varianceB = (hashFloat(seed + branchId * 2.91) - 0.5) * 2 * localSpread * jitter;
      const scaleA = branchScale * (0.88 + hashFloat(seed + branchId * 5.11) * 0.18);
      const scaleB = branchScale * (0.88 + hashFloat(seed + branchId * 7.77) * 0.18);
      const branchSway = baseSway * mix(0.22, 0.42, depth / Math.max(1, levels - 1));

      drawBranch(endX, endY, length * scaleA, angle + localSpread + varianceA + branchSway, depth + 1, branchId * 2);
      drawBranch(endX, endY, length * scaleB, angle - localSpread + varianceB + branchSway, depth + 1, branchId * 2 + 1);

      const supportsSprig = depth >= 1 && depth <= matureLevels - 3 && structuralMaturity >= 0.28;
      if (supportsSprig && hashFloat(seed + branchId * 9.13) > 0.34) {
        const spurDirection = hashFloat(seed + branchId * 11.3) > 0.5 ? 1 : -1;
        const spurAngle = angle + spurDirection * localSpread * mix(0.22, 0.4, hashFloat(seed + branchId * 1.11));
        const spurScale = branchScale * (0.52 + hashFloat(seed + branchId * 6.3) * 0.12);
        drawBranch(endX, endY, length * spurScale, spurAngle + branchSway * 0.7, depth + 1, branchId * 3 + 17);
      }

      if (depth >= matureLevels - 2) {
        drawLeafCluster(endX, endY, branchId, depth);
      }
    };

    drawBranch(0, 0, baseLength, Math.PI / 2 + baseSway, 0, 1);
    drawFallenLeaves();
    ctx.restore();
  }
}
