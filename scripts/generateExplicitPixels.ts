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

function eyeColor(x: number, y: number): [number, number, number] {
  const nx = (x + 0.5) / W;
  const ny = (y + 0.5) / H;
  const dx = (nx - 0.5) * 1.35;
  const dy = (ny - 0.5) * 1.6;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ring = Math.exp(-Math.pow((dist - 0.28) * 4.8, 2));
  const pupil = Math.exp(-Math.pow(dist * 8.4, 2));
  const iris = Math.exp(-Math.pow((dist - 0.2) * 8.5, 2));
  const lid = Math.exp(-Math.pow((dy + 0.18) * 7.5, 2));
  const glow = Math.exp(-Math.pow((dx + 0.22) * 11, 2) - Math.pow((dy + 0.08) * 13, 2));
  const dither = ((x & 1) ^ (y & 1)) * 0.04;

  const baseR = 18 + 170 * ring + 58 * iris + 180 * glow - 210 * pupil + 24 * lid;
  const baseG = 12 + 70 * ring + 22 * iris + 120 * glow - 190 * pupil + 14 * lid;
  const baseB = 30 + 200 * ring + 75 * iris + 220 * glow - 220 * pupil + 18 * lid;

  return [
    clampByte(baseR * (0.95 + dither)),
    clampByte(baseG * (0.9 + dither)),
    clampByte(baseB * (0.95 + dither))
  ];
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
      const [r, g, b] = eyeColor(x, y);
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
