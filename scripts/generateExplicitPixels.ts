import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APPLY_FUNCTION_NAME = "applyExplicit_frameBytes";

export function syncExplicitPixelsArtifacts(cwd = process.cwd()): void {
  const framePath = path.resolve(cwd, "src/generated/explicitPixelsFrame.ts");
  const metaPath = path.resolve(cwd, "src/generated/explicitPixelsMeta.ts");

  if (!fs.existsSync(framePath)) {
    throw new Error(`Missing generated frame source at ${framePath}`);
  }

  const frameSource = fs.readFileSync(framePath, "utf8");

  if (!frameSource.includes(`export function ${APPLY_FUNCTION_NAME}(`)) {
    throw new Error(
      `Expected ${path.relative(cwd, framePath)} to export ${APPLY_FUNCTION_NAME}; refusing to regenerate frame data.`
    );
  }

  const assignmentCount = (frameSource.match(/(?:data|dst)\[/g) ?? []).length;
  const generatedFileBytes = Buffer.byteLength(frameSource, "utf8");

  const metaSource = `export const assignmentCount = ${assignmentCount};\nexport const generatedFileBytes = ${generatedFileBytes};\n`;
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, metaSource, "utf8");
}

const isEntrypoint = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isEntrypoint) {
  syncExplicitPixelsArtifacts();
}
