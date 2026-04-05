import fs from "node:fs";
import path from "node:path";

const W = 128;
const H = 72;
const CHANNELS = 4;

const framePath = path.resolve(process.cwd(), "src/generated/explicitPixelsFrame.ts");
const metaPath = path.resolve(process.cwd(), "src/generated/explicitPixelsMeta.ts");

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function pixelColor(x: number, y: number): [number, number, number] {
  const nx = (x + 0.5) / W;
  const ny = (y + 0.5) / H;

  const dx = Math.abs(nx - 0.5) * 2;
  const dy = Math.abs(ny - 0.49) * 2;

  const rx = Math.pow(dx / 0.93, 2.25);
  const ry = Math.pow(dy / 0.9, 1.85);
  const borderMask = Math.max(0, Math.min(1, rx + ry));
  const edge = smoothstep(0.9, 1.06, borderMask);
  const spark = hash2(x, y);

  const bgTwinkle = spark > 0.84 ? 1 : 0;
  const bgR = clampByte(2 + 6 * bgTwinkle);
  const bgG = clampByte(5 + 18 * bgTwinkle);
  const bgB = clampByte(40 + 80 * bgTwinkle);

  const centerFade = smoothstep(0.8, 0.25, Math.max(dx * 0.72, dy * 0.82));
  const centerWhite = clampByte(232 + 23 * centerFade);

  let r = mix(bgR, centerWhite, 1 - edge);
  let g = mix(bgG, centerWhite, 1 - edge);
  let b = mix(bgB, centerWhite, 1 - edge);

  if (edge > 0.05) {
    const stripeA = Math.sin((nx * 19 + ny * 17) * Math.PI);
    const stripeB = Math.sin((nx * -24 + ny * 21) * Math.PI);
    const streak = Math.max(0, stripeA * 0.55 + stripeB * 0.45);
    const streakMask = edge * smoothstep(0.45, 1, streak + (spark - 0.5) * 0.38);

    const palette = [
      [34, 214, 255],
      [206, 93, 255],
      [95, 255, 151],
      [255, 230, 84],
      [96, 130, 255],
      [255, 96, 187]
    ] as const;
    const colorPick = palette[Math.floor(hash2(x + 17, y + 29) * palette.length) % palette.length];

    r = mix(r, colorPick[0], streakMask * 0.85);
    g = mix(g, colorPick[1], streakMask * 0.85);
    b = mix(b, colorPick[2], streakMask * 0.85);

    const confetti = spark > 0.965 ? 1 : 0;
    if (confetti) {
      r = mix(r, colorPick[0], 0.9);
      g = mix(g, colorPick[1], 0.9);
      b = mix(b, colorPick[2], 0.9);
    }
  }

  const crowdLine = 0.73 + 0.17 * Math.pow(Math.abs(nx - 0.5), 1.25);
  if (ny > crowdLine) {
    const n0 = hash2(Math.floor(nx * 70), Math.floor(ny * 80));
    const n1 = hash2(Math.floor(nx * 40) + 23, Math.floor(ny * 37) + 11);
    const headHeight = crowdLine - (0.02 + n0 * 0.08);
    if (ny > headHeight) {
      const glow = smoothstep(0.98, 0.15, Math.abs(nx - 0.5));
      r = mix(0, 10 + 60 * glow, 0.4);
      g = mix(0, 20 + 90 * glow, 0.4);
      b = mix(20, 130 + 90 * glow, 0.5);

      const handFreq = Math.sin(nx * 80 + n1 * 5.5);
      const handMask = handFreq > 0.94 && ny < crowdLine - 0.03 && ny > crowdLine - 0.13;
      if (handMask) {
        r = 8;
        g = 10;
        b = 65;
      }
    }
  }

  return [clampByte(r), clampByte(g), clampByte(b)];
}

function writeMetaFromFrameSource(frameSource: string): void {
  const assignmentCount = (frameSource.match(/data\[/g) ?? []).length;
  const generatedFileBytes = Buffer.byteLength(frameSource, "utf8");
  const metaSource = `export const assignmentCount = ${assignmentCount};\nexport const generatedFileBytes = ${generatedFileBytes};\n`;
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, metaSource, "utf8");
}

function generateFrameSource(): string {
  const lines: string[] = [];
  lines.push(`export const W = ${W};`);
  lines.push(`export const H = ${H};`);
  lines.push("");
  lines.push("export function applyExplicit(data: Uint8ClampedArray): void {");

  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const [r, g, b] = pixelColor(x, y);
      const idx = (y * W + x) * CHANNELS;
      lines.push(`  data[${idx}] = ${r};`);
      lines.push(`  data[${idx + 1}] = ${g};`);
      lines.push(`  data[${idx + 2}] = ${b};`);
      lines.push(`  data[${idx + 3}] = 255;`);
    }
  }

  lines.push("}");
  return `${lines.join("\n")}\n`;
}

function main(): void {
  const forceRegenerate = process.argv.includes("--force");

  if (!forceRegenerate && fs.existsSync(framePath)) {
    const existingFrameSource = fs.readFileSync(framePath, "utf8");
    writeMetaFromFrameSource(existingFrameSource);
    return;
  }

  const frameSource = generateFrameSource();
  fs.mkdirSync(path.dirname(framePath), { recursive: true });
  fs.writeFileSync(framePath, frameSource, "utf8");
  writeMetaFromFrameSource(frameSource);
}

main();
