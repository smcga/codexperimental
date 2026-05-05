import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const rootDir = resolve(new URL("..", import.meta.url).pathname);
const distDir = resolve(rootDir, "dist");
const outputDir = resolve(rootDir, "dist-release");
const packageJsonPath = resolve(rootDir, "package.json");

if (!existsSync(distDir)) {
  throw new Error("dist/ was not found. Run `npm run build:release` before packaging.");
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
cpSync(distDir, outputDir, { recursive: true });

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string; version?: string };
let gitCommit: string | null = null;
try {
  gitCommit = execSync("git rev-parse HEAD", { cwd: rootDir, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
} catch {
  gitCommit = null;
}

const buildInfo = {
  packageName: packageJson.name ?? "unknown",
  version: packageJson.version ?? "0.0.0",
  gitCommit,
  buildTimestamp: new Date().toISOString(),
  canonicalTimelinePath: "public/timeline.release.json",
  timingAnchorDocPath: "docs/sacred-musical-anchors.md",
  releaseModeQuery: "?release=1"
};

writeFileSync(resolve(outputDir, "build-info.json"), `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");
console.log("Created dist-release/ with build-info.json");
