import { clamp } from "../../util/math";
import { Effect, EffectRenderContext } from "./types";

export const ASCII_ARCADE_MASHUP_DEFAULTS = {
  speed: 1,
  blend: 0.5,
  density: 1,
  glow: 0.45,
  scanlines: 0.28,
  seed: 1980
};

export type AsciiArcadeMashupParams = typeof ASCII_ARCADE_MASHUP_DEFAULTS;

type Snapshot = string[];

const asFinite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const hash = (value: number, seed: number): number => {
  const n = Math.sin(value * 12.9898 + seed * 78.233) * 43758.5453123;
  return n - Math.floor(n);
};

export const resolveAsciiArcadeMashupParams = (params: Record<string, number>): AsciiArcadeMashupParams => ({
  speed: clamp(asFinite(params.speed, ASCII_ARCADE_MASHUP_DEFAULTS.speed), 0.2, 3),
  blend: clamp(asFinite(params.blend, ASCII_ARCADE_MASHUP_DEFAULTS.blend), 0, 1),
  density: clamp(asFinite(params.density, ASCII_ARCADE_MASHUP_DEFAULTS.density), 0.5, 1.8),
  glow: clamp(asFinite(params.glow, ASCII_ARCADE_MASHUP_DEFAULTS.glow), 0, 1),
  scanlines: clamp(asFinite(params.scanlines, ASCII_ARCADE_MASHUP_DEFAULTS.scanlines), 0, 1),
  seed: Math.round(Math.abs(asFinite(params.seed, ASCII_ARCADE_MASHUP_DEFAULTS.seed)))
});

const PONG = [
  "+--------------------------+",
  "| 0                      0 |",
  "|                          |",
  "|   |                 |    |",
  "|   |        o        |    |",
  "|   |                 |    |",
  "|                          |",
  "+--------------------------+"
];

const PAC = [
  "############################",
  "# C . . . . ## . . . . .  #",
  "# . #### . . ## . #### .  #",
  "# . #  # . .  V  . #  # . #",
  "# . #### . . ## . #### .  #",
  "# . . . . . ## . . . . .  #",
  "############################"
];

const ASTEROIDS = [
  "      .       *        .    ",
  "   *      .      *          ",
  "        /\\                 ",
  "       /__\\     <>      *  ",
  "   *    ||        *         ",
  "      <>      *         .   ",
  " .         *       <>       "
];

const INVADERS = [
  "   _._     _._     _._      ",
  "  (o o)   (o o)   (o o)     ",
  " /( : )\\ /( : )\\ /( : )\\   ",
  "  ^^ ^^   ^^ ^^   ^^ ^^      ",
  "            |               ",
  "           /A\\              ",
  "          /___\\             "
];

const SNAPSHOTS: Snapshot[] = [PONG, PAC, ASTEROIDS, INVADERS];

export const selectSnapshotIndices = (time: number, speed: number): { from: number; to: number; t: number } => {
  const phase = time * (0.22 + speed * 0.28);
  const from = Math.floor(phase) % SNAPSHOTS.length;
  const to = (from + 1) % SNAPSHOTS.length;
  return { from, to, t: phase - Math.floor(phase) };
};

export class AsciiArcadeMashupEffect implements Effect {
  render({ ctx, width, height, time, params }: EffectRenderContext): void {
    const resolved = resolveAsciiArcadeMashupParams(params as Record<string, number>);
    const { from, to, t } = selectSnapshotIndices(time, resolved.speed);
    const blendMix = clamp(mix(t, 0.5, resolved.blend), 0, 1);

    const left = SNAPSHOTS[from] ?? SNAPSHOTS[0];
    const right = SNAPSHOTS[to] ?? SNAPSHOTS[1];

    const cols = Math.max(...left.map((line) => line.length), ...right.map((line) => line.length));
    const rows = Math.max(left.length, right.length);

    const cell = Math.max(8, Math.floor((Math.min(width, height) / (rows + cols * 0.25)) * resolved.density));
    const x0 = Math.round((width - cols * cell * 0.6) * 0.5);
    const y0 = Math.round((height - rows * cell) * 0.5);

    ctx.fillStyle = "#030b03";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = `${Math.max(8, Math.round(cell * 0.8))}px 'Courier New', monospace`;
    ctx.shadowColor = `rgba(110,255,140,${0.3 + resolved.glow * 0.7})`;
    ctx.shadowBlur = 8 + resolved.glow * 22;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const a = left[y]?.[x] ?? " ";
        const b = right[y]?.[x] ?? " ";
        const h = hash(x * 131 + y * 977 + Math.floor(time * 60), resolved.seed);
        const char = h < blendMix ? b : a;

        if (char !== " ") {
          const intensity = 0.35 + 0.65 * (1 - Math.abs(blendMix - h));
          const green = Math.round(120 + intensity * 110);
          ctx.fillStyle = `rgb(${Math.round(green * 0.45)},${green},${Math.round(green * 0.52)})`;
          ctx.fillText(char, x0 + x * cell * 0.6, y0 + y * cell);
        }
      }
    }

    if (resolved.scanlines > 0.01) {
      const alpha = resolved.scanlines * 0.18;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      for (let y = 0; y < height; y += 4) {
        ctx.fillRect(0, y, width, 2);
      }
    }
  }
}
