import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

type ClothPinMode = "corners" | "top";
type ClothPaletteMode = "era" | "mono" | "neon";
type ObstacleMode = "none" | "sphere" | "pillar";

type ClothSimParams = {
  width: number;
  height: number;
  cols: number;
  rows: number;
  gravity: number;
  damping: number;
  stiffness: number;
  iterations: number;
  wind: number;
  flutter: number;
  audioReactive: number;
  pinMode: ClothPinMode;
  driftX: number;
  driftY: number;
  shading: number;
  seamAlpha: number;
  paletteMode: ClothPaletteMode;
  backgroundAlpha: number;
  mobileQuality: number;
  obstacle: ObstacleMode;
  obstacleSize: number;
};

type ClothStateMeta = {
  cols: number;
  rows: number;
  pinMode: ClothPinMode;
  obstacle: ObstacleMode;
  width: number;
  height: number;
};

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
  pinX: number;
  pinY: number;
};

type Constraint = {
  a: number;
  b: number;
  rest: number;
  stiffness: number;
};

type ColorTriplet = {
  base: [number, number, number];
  shadow: [number, number, number];
  highlight: [number, number, number];
};

const MAX_SIM_DELTA = 1 / 24;
const FIXED_STEP = 1 / 60;
const MAX_SUBSTEPS = 4;

export const CLOTH_SIM_DEFAULTS = {
  width: 0.74,
  height: 0.58,
  cols: 24,
  rows: 16,
  gravity: 0.58,
  damping: 0.984,
  stiffness: 0.9,
  iterations: 4,
  wind: 0.58,
  flutter: 0.35,
  audioReactive: 0.62,
  pinMode: "corners",
  driftX: 0,
  driftY: -0.1,
  shading: 0.8,
  seamAlpha: 0.24,
  paletteMode: "era",
  backgroundAlpha: 0.18,
  mobileQuality: 0.82,
  obstacle: "none",
  obstacleSize: 0.18
} as const;

const asFiniteNumber = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const asEnum = <T extends string>(value: unknown, options: readonly T[], fallback: T): T => {
  if (typeof value === "string" && options.includes(value as T)) {
    return value as T;
  }
  return fallback;
};

export const resolveClothSimParams = (params: Record<string, unknown>, isMobile: boolean): ClothSimParams => {
  const mobileQuality = clamp(asFiniteNumber(params.mobileQuality, CLOTH_SIM_DEFAULTS.mobileQuality), 0.35, 1);
  const quality = isMobile ? mobileQuality : 1;

  const cols = Math.floor(
    clamp(
      asFiniteNumber(params.cols, CLOTH_SIM_DEFAULTS.cols) * (0.7 + quality * 0.3),
      8,
      52
    )
  );
  const rows = Math.floor(
    clamp(
      asFiniteNumber(params.rows, CLOTH_SIM_DEFAULTS.rows) * (0.7 + quality * 0.3),
      6,
      36
    )
  );

  return {
    width: clamp(asFiniteNumber(params.width, CLOTH_SIM_DEFAULTS.width), 0.2, 1),
    height: clamp(asFiniteNumber(params.height, CLOTH_SIM_DEFAULTS.height), 0.2, 1),
    cols,
    rows,
    gravity: clamp(asFiniteNumber(params.gravity, CLOTH_SIM_DEFAULTS.gravity), 0, 2),
    damping: clamp(asFiniteNumber(params.damping, CLOTH_SIM_DEFAULTS.damping), 0.85, 0.999),
    stiffness: clamp(asFiniteNumber(params.stiffness, CLOTH_SIM_DEFAULTS.stiffness), 0.35, 1),
    iterations: Math.floor(clamp(asFiniteNumber(params.iterations, CLOTH_SIM_DEFAULTS.iterations), 1, 10)),
    wind: clamp(asFiniteNumber(params.wind, CLOTH_SIM_DEFAULTS.wind), 0, 2),
    flutter: clamp(asFiniteNumber(params.flutter, CLOTH_SIM_DEFAULTS.flutter), 0, 1.4),
    audioReactive: clamp(asFiniteNumber(params.audioReactive, CLOTH_SIM_DEFAULTS.audioReactive), 0, 1),
    pinMode: asEnum(params.pinMode, ["corners", "top"] as const, CLOTH_SIM_DEFAULTS.pinMode),
    driftX: clamp(asFiniteNumber(params.driftX, CLOTH_SIM_DEFAULTS.driftX), -1, 1),
    driftY: clamp(asFiniteNumber(params.driftY, CLOTH_SIM_DEFAULTS.driftY), -1, 1),
    shading: clamp(asFiniteNumber(params.shading, CLOTH_SIM_DEFAULTS.shading), 0, 1.5),
    seamAlpha: clamp(asFiniteNumber(params.seamAlpha, CLOTH_SIM_DEFAULTS.seamAlpha), 0, 0.7),
    paletteMode: asEnum(params.paletteMode, ["era", "mono", "neon"] as const, CLOTH_SIM_DEFAULTS.paletteMode),
    backgroundAlpha: clamp(asFiniteNumber(params.backgroundAlpha, CLOTH_SIM_DEFAULTS.backgroundAlpha), 0, 1),
    mobileQuality,
    obstacle: asEnum(params.obstacle, ["none", "sphere", "pillar"] as const, CLOTH_SIM_DEFAULTS.obstacle),
    obstacleSize: clamp(asFiniteNumber(params.obstacleSize, CLOTH_SIM_DEFAULTS.obstacleSize), 0.08, 0.45)
  };
};

const particleIndex = (x: number, y: number, cols: number): number => y * cols + x;

const dist = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
};

export class ClothSimulation {
  particles: Particle[] = [];
  constraints: Constraint[] = [];
  private anchorPhase: number[] = [];
  meta: ClothStateMeta = {
    cols: 0,
    rows: 0,
    pinMode: "corners",
    obstacle: "none",
    width: 0,
    height: 0
  };

  init(width: number, height: number, params: ClothSimParams): void {
    this.meta = {
      cols: params.cols,
      rows: params.rows,
      pinMode: params.pinMode,
      obstacle: params.obstacle,
      width,
      height
    };

    this.particles = [];
    this.constraints = [];
    this.anchorPhase = [];

    const clothW = width * params.width;
    const clothH = height * params.height;
    const originX = (width - clothW) * 0.5 + width * 0.18 * params.driftX;
    const originY = Math.max(height * 0.06, (height - clothH) * 0.2 + height * 0.18 * params.driftY);

    const dx = params.cols > 1 ? clothW / (params.cols - 1) : clothW;
    const dy = params.rows > 1 ? clothH / (params.rows - 1) : clothH;

    for (let y = 0; y < params.rows; y += 1) {
      for (let x = 0; x < params.cols; x += 1) {
        const px = originX + x * dx;
        const py = originY + y * dy;
        const pinTop = y === 0;
        const pinCorners = pinTop && (x === 0 || x === params.cols - 1 || x === Math.floor((params.cols - 1) * 0.5));
        const pinned = params.pinMode === "top" ? pinTop : pinCorners;
        this.particles.push({ x: px, y: py, px, py, pinned, pinX: px, pinY: py });
        this.anchorPhase.push(x * 0.43 + y * 0.19);
      }
    }

    const pushConstraint = (ax: number, ay: number, bx: number, by: number, stiffness = 1): void => {
      if (ax < 0 || ay < 0 || bx < 0 || by < 0 || ax >= params.cols || bx >= params.cols || ay >= params.rows || by >= params.rows) {
        return;
      }
      const a = particleIndex(ax, ay, params.cols);
      const b = particleIndex(bx, by, params.cols);
      const pa = this.particles[a];
      const pb = this.particles[b];
      this.constraints.push({ a, b, rest: dist(pa.x, pa.y, pb.x, pb.y), stiffness });
    };

    for (let y = 0; y < params.rows; y += 1) {
      for (let x = 0; x < params.cols; x += 1) {
        pushConstraint(x, y, x + 1, y, 1);
        pushConstraint(x, y, x, y + 1, 1);
        pushConstraint(x, y, x + 1, y + 1, 0.72);
        pushConstraint(x + 1, y, x, y + 1, 0.72);
      }
    }
  }

  shouldReinitialize(width: number, height: number, params: ClothSimParams): boolean {
    if (this.particles.length === 0) {
      return true;
    }
    return (
      this.meta.cols !== params.cols ||
      this.meta.rows !== params.rows ||
      this.meta.pinMode !== params.pinMode ||
      this.meta.obstacle !== params.obstacle ||
      Math.abs(this.meta.width - width) > 0.5 ||
      Math.abs(this.meta.height - height) > 0.5
    );
  }

  integrate(
    step: number,
    params: ClothSimParams,
    drive: { gravity: number; wind: number; flutter: number; beatKick: number; time: number; mid: number; treble: number }
  ): void {
    const gravityForce = params.gravity * drive.gravity * 900;

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      if (p.pinned) {
        const anchorJitter = 1 + drive.beatKick * 4;
        p.x = p.pinX + Math.sin(drive.time * 3.2 + this.anchorPhase[i]) * 0.3 * anchorJitter;
        p.y = p.pinY + Math.cos(drive.time * 2.4 + this.anchorPhase[i] * 0.7) * 0.25 * anchorJitter;
        p.px = p.x;
        p.py = p.y;
        continue;
      }

      const vx = (p.x - p.px) * params.damping;
      const vy = (p.y - p.py) * params.damping;
      const edgeFactor = 1 - Math.abs((p.x - this.meta.width * 0.5) / (this.meta.width * 0.5));
      const edgeFlutter = (1 - edgeFactor) * drive.flutter * (0.6 + drive.treble * 1.2);
      const gust = drive.wind * (0.65 + drive.mid * 0.6 + Math.sin(drive.time * 0.8 + p.y * 0.012) * 0.35);
      const windX = gust * 32 + Math.sin(drive.time * 9.5 + p.y * 0.05) * edgeFlutter * 15;
      const windY = Math.cos(drive.time * 7.1 + p.x * 0.06) * edgeFlutter * 6 + drive.beatKick * 45;

      p.px = p.x;
      p.py = p.y;
      p.x += vx + windX * step;
      p.y += vy + (gravityForce + windY) * step;
    }
  }

  solveConstraints(iterations: number, stiffness: number): void {
    const clampedIterations = Math.floor(clamp(iterations, 1, 10));

    for (let pass = 0; pass < clampedIterations; pass += 1) {
      for (let i = 0; i < this.constraints.length; i += 1) {
        const c = this.constraints[i];
        const a = this.particles[c.a];
        const b = this.particles[c.b];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1e-6;
        const error = (distance - c.rest) / distance;
        const correction = 0.5 * error * stiffness * c.stiffness;
        const cx = dx * correction;
        const cy = dy * correction;

        if (!a.pinned) {
          a.x += cx;
          a.y += cy;
        }
        if (!b.pinned) {
          b.x -= cx;
          b.y -= cy;
        }
      }

      for (let i = 0; i < this.particles.length; i += 1) {
        const p = this.particles[i];
        if (p.pinned) {
          p.x = p.pinX;
          p.y = p.pinY;
        }
      }
    }
  }

  applyBounds(width: number, height: number, params: ClothSimParams): void {
    const floor = height * 0.96;
    const left = width * 0.02;
    const right = width * 0.98;
    const obstacleRadius = Math.min(width, height) * params.obstacleSize;
    const obstacleX = width * 0.5;
    const obstacleY = height * (params.obstacle === "pillar" ? 0.72 : 0.68);

    for (let i = 0; i < this.particles.length; i += 1) {
      const p = this.particles[i];
      if (p.pinned) {
        continue;
      }

      if (p.y > floor) {
        p.y = floor;
      }
      if (p.x < left) {
        p.x = left;
      } else if (p.x > right) {
        p.x = right;
      }

      if (params.obstacle !== "none") {
        const radiusX = params.obstacle === "pillar" ? obstacleRadius * 0.7 : obstacleRadius;
        const dx = p.x - obstacleX;
        const dy = p.y - obstacleY;
        const norm = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (obstacleRadius * obstacleRadius);
        if (norm < 1) {
          const angle = Math.atan2(dy, dx || 1e-5);
          p.x = obstacleX + Math.cos(angle) * radiusX;
          p.y = obstacleY + Math.sin(angle) * obstacleRadius;
        }
      }
    }
  }
}

const quantize = (value: number, steps: number): number => {
  if (steps <= 1) {
    return value;
  }
  return Math.round(value * steps) / steps;
};

const resolveColors = (mode: ClothPaletteMode, era?: string): ColorTriplet => {
  if (mode === "mono") {
    return {
      base: [150, 156, 168],
      shadow: [36, 40, 48],
      highlight: [236, 238, 244]
    };
  }
  if (mode === "neon") {
    return {
      base: [80, 188, 255],
      shadow: [10, 18, 48],
      highlight: [196, 255, 255]
    };
  }

  switch (era) {
    case "8bit":
      return { base: [140, 188, 224], shadow: [24, 42, 96], highlight: [236, 248, 255] };
    case "16bit":
      return { base: [124, 178, 212], shadow: [18, 34, 82], highlight: [230, 244, 255] };
    case "ps1":
      return { base: [134, 152, 210], shadow: [34, 34, 76], highlight: [238, 236, 255] };
    case "pcdemo":
      return { base: [116, 188, 236], shadow: [16, 34, 60], highlight: [232, 255, 255] };
    case "future":
      return { base: [88, 220, 248], shadow: [10, 24, 56], highlight: [210, 255, 255] };
    default:
      return { base: [126, 170, 214], shadow: [22, 38, 78], highlight: [230, 244, 255] };
  }
};

const mixColor = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t)
];

export const averageConstraintStretch = (sim: ClothSimulation): number => {
  if (sim.constraints.length === 0) {
    return 0;
  }
  let total = 0;
  for (let i = 0; i < sim.constraints.length; i += 1) {
    const c = sim.constraints[i];
    const a = sim.particles[c.a];
    const b = sim.particles[c.b];
    const length = dist(a.x, a.y, b.x, b.y);
    total += Math.abs(length - c.rest) / Math.max(c.rest, 1e-6);
  }
  return total / sim.constraints.length;
};

export class ClothSimEffect implements Effect {
  private sim = new ClothSimulation();
  private accumulator = 0;
  private beatPulse = 0;

  reset(): void {
    this.sim = new ClothSimulation();
    this.accumulator = 0;
    this.beatPulse = 0;
  }

  render({ ctx, width, height, time, delta, audio, params, era, framing, safeRect }: EffectRenderContext): void {
    const isMobile = framing?.mode === "mobileFit";
    const config = resolveClothSimParams(params as Record<string, unknown>, isMobile);

    if (this.sim.shouldReinitialize(width, height, config)) {
      this.sim.init(width, height, config);
      this.accumulator = 0;
      this.beatPulse = 0;
    }

    if (audio.beat) {
      this.beatPulse = Math.max(this.beatPulse, clamp(audio.beatStrength, 0, 1));
    }

    this.beatPulse *= 0.92;

    const clampedDelta = clamp(delta, 0, MAX_SIM_DELTA);
    this.accumulator += clampedDelta;

    const baseWind = config.wind * (0.6 + Math.sin(time * 0.31) * 0.2 + Math.sin(time * 0.93) * 0.2);
    const reactive = config.audioReactive;
    const drive = {
      gravity: 0.9 + audio.rms * 0.4,
      wind: baseWind * (1 + audio.bass * reactive * 0.9),
      flutter: config.flutter * (0.6 + audio.treble * reactive * 1.8),
      beatKick: this.beatPulse * reactive,
      time,
      mid: audio.mid * reactive,
      treble: audio.treble * reactive
    };

    let substeps = 0;
    while (this.accumulator >= FIXED_STEP && substeps < MAX_SUBSTEPS) {
      this.sim.integrate(FIXED_STEP, config, drive);
      this.sim.solveConstraints(config.iterations, config.stiffness);
      this.sim.applyBounds(width, height, config);
      this.accumulator -= FIXED_STEP;
      substeps += 1;
    }

    if (substeps === MAX_SUBSTEPS) {
      this.accumulator = 0;
    }

    if (config.backgroundAlpha > 0) {
      ctx.fillStyle = `rgba(6, 10, 18, ${config.backgroundAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
    }

    if (config.obstacle !== "none") {
      const obstacleRadius = Math.min(width, height) * config.obstacleSize;
      const obstacleY = height * (config.obstacle === "pillar" ? 0.72 : 0.68);
      const gradient = ctx.createRadialGradient(width * 0.5, obstacleY, obstacleRadius * 0.2, width * 0.5, obstacleY, obstacleRadius);
      gradient.addColorStop(0, "rgba(255,255,255,0.13)");
      gradient.addColorStop(1, "rgba(0,0,0,0.12)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      if (config.obstacle === "pillar") {
        ctx.ellipse(width * 0.5, obstacleY, obstacleRadius * 0.7, obstacleRadius, 0, 0, Math.PI * 2);
      } else {
        ctx.arc(width * 0.5, obstacleY, obstacleRadius, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    const palette = resolveColors(config.paletteMode, era);
    const lowFi = era === "8bit" || era === "16bit";
    const quantSteps = era === "8bit" ? 4 : era === "16bit" ? 6 : 0;

    for (let y = 0; y < config.rows - 1; y += 1) {
      for (let x = 0; x < config.cols - 1; x += 1) {
        const i00 = particleIndex(x, y, config.cols);
        const i10 = particleIndex(x + 1, y, config.cols);
        const i01 = particleIndex(x, y + 1, config.cols);
        const i11 = particleIndex(x + 1, y + 1, config.cols);

        const p00 = this.sim.particles[i00];
        const p10 = this.sim.particles[i10];
        const p01 = this.sim.particles[i01];
        const p11 = this.sim.particles[i11];

        const dx = ((p10.y - p00.y) + (p11.y - p01.y)) * 0.5;
        const dy = ((p01.x - p00.x) + (p11.x - p10.x)) * 0.5;
        const facing = clamp(0.5 + (dx * -0.02 + dy * 0.01) * config.shading, 0, 1);

        const topEdge = dist(p00.x, p00.y, p10.x, p10.y);
        const leftEdge = dist(p00.x, p00.y, p01.x, p01.y);
        const stretch = clamp((topEdge + leftEdge) / Math.max(2, (this.sim.meta.width / config.cols) + (this.sim.meta.height / config.rows)) - 1, -0.7, 1.2);
        const shadowT = clamp(0.4 - facing * 0.5 + Math.max(0, -stretch) * 0.85, 0, 1);
        const highlightT = clamp(facing * 0.7 + Math.max(0, stretch) * 0.95, 0, 1);

        const mixed = mixColor(mixColor(palette.base, palette.shadow, shadowT), palette.highlight, highlightT * 0.7);

        const r = lowFi ? Math.round(quantize(mixed[0] / 255, quantSteps) * 255) : mixed[0];
        const g = lowFi ? Math.round(quantize(mixed[1] / 255, quantSteps) * 255) : mixed[1];
        const b = lowFi ? Math.round(quantize(mixed[2] / 255, quantSteps) * 255) : mixed[2];

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();
        ctx.fill();

        if (era === "future" && config.shading > 0.45) {
          const glow = clamp(0.02 + highlightT * 0.08, 0, 0.12);
          ctx.fillStyle = `rgba(120, 255, 255, ${glow.toFixed(3)})`;
          ctx.fill();
        }
      }
    }

    if (config.seamAlpha > 0.01) {
      const seamBase = era === "8bit" ? 0.45 : config.seamAlpha;
      ctx.strokeStyle = `rgba(255, 255, 255, ${seamBase.toFixed(3)})`;
      ctx.lineWidth = lowFi ? 1.3 : 1;
      for (let y = 0; y < config.rows; y += 1) {
        ctx.beginPath();
        for (let x = 0; x < config.cols; x += 1) {
          const p = this.sim.particles[particleIndex(x, y, config.cols)];
          if (x === 0) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }
    }

    if (isMobile && safeRect) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.0)";
      ctx.strokeRect(safeRect.x, safeRect.y, safeRect.w, safeRect.h);
    }
  }
}
