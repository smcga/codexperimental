import fs from "node:fs";
import path from "node:path";
import { buildEffectChronologyMarkdown } from "../src/renderer/effects/effectChronology";

const docsPath = path.resolve(process.cwd(), "docs/effect-chronology.md");

fs.mkdirSync(path.dirname(docsPath), { recursive: true });
fs.writeFileSync(docsPath, `${buildEffectChronologyMarkdown()}\n`, "utf-8");

console.log("Generated docs/effect-chronology.md");
