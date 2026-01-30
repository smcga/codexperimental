import { TimelineConfig } from "./loadConfig";

const EPSILON = 1e-6;

export function validateTimelineConfig(config: TimelineConfig): void {
  if (!config.intro || typeof config.intro.end !== "number") {
    throw new Error("Config error: intro.end must be a number");
  }

  const firstSectionStart = config.sections[0]?.start;
  if (firstSectionStart === undefined) {
    throw new Error("Config error: sections must include at least one entry");
  }

  if (Math.abs(firstSectionStart - config.intro.end) > EPSILON) {
    throw new Error(`Config error: first section must start at ${config.intro.end}`);
  }
}
