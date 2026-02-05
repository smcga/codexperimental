import fs from "node:fs";
import path from "node:path";
import { generateEffectsDoc } from "../src/renderer/effects/effectsDocGenerator";

const { markdown, effectNames } = generateEffectsDoc();
const docsPath = path.resolve(process.cwd(), "docs/effects.md");

fs.mkdirSync(path.dirname(docsPath), { recursive: true });
fs.writeFileSync(docsPath, markdown, "utf-8");

console.log(`Generated docs/effects.md for ${effectNames.length} effects.`);
