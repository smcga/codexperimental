import fs from "node:fs";
import path from "node:path";
import { generateTransitionsDoc } from "../src/renderer/transitions/transitionsDocGenerator";

const { markdown, transitions } = generateTransitionsDoc();
const docsPath = path.resolve(process.cwd(), "docs/Transitions.md");

fs.mkdirSync(path.dirname(docsPath), { recursive: true });
fs.writeFileSync(docsPath, markdown, "utf-8");

console.log(`Generated docs/Transitions.md for ${transitions.length} transitions.`);
