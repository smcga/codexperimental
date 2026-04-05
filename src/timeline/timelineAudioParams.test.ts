import { describe, expect, it } from "vitest";

import docs from "../../docs/effects.md?raw";
import timeline from "../../public/timeline.release.json";

type SupportFlags = {
  audioReact: boolean;
  audioReactive: boolean;
  kickImpulse: boolean;
  beatImpulse: boolean;
};

type TimelineEntry = {
  id?: string;
  effect: string;
  params?: Record<string, unknown>;
  layers?: TimelineEntry[];
};

const PARAM_LIMIT = 0.2;

function readSupportedParamsFromDocs(): Map<string, SupportFlags> {
  const supports = new Map<string, SupportFlags>();
  let currentEffect: string | null = null;

  docs.split(/\r?\n/).forEach((line) => {
    const effectMatch = line.match(/^## Effect: (.+)$/);
    if (effectMatch) {
      currentEffect = effectMatch[1];
      supports.set(currentEffect, {
        audioReact: false,
        audioReactive: false,
        kickImpulse: false,
        beatImpulse: false,
      });
      return;
    }

    const paramMatch = line.match(/^\| `params\.([a-zA-Z0-9_]+)` \|/);
    if (!paramMatch || !currentEffect) {
      return;
    }

    const param = paramMatch[1];
    const flags = supports.get(currentEffect);
    if (!flags) {
      return;
    }

    if (param === "audioReact") {
      flags.audioReact = true;
    } else if (param === "audioReactive") {
      flags.audioReactive = true;
    } else if (param === "kickImpulse") {
      flags.kickImpulse = true;
    } else if (param === "beatImpulse") {
      flags.beatImpulse = true;
    }
  });

  return supports;
}

function* allEntries(sections: TimelineEntry[]): Generator<TimelineEntry> {
  for (const section of sections) {
    yield section;
    if (section.layers) {
      for (const layer of section.layers) {
        yield layer;
      }
    }
  }
}

function expectParam(entry: TimelineEntry, paramName: keyof SupportFlags): void {
  const params = entry.params ?? {};
  expect(params, `${entry.id ?? entry.effect} should define ${paramName}`).toHaveProperty(paramName);
  const value = params[paramName];
  expect(typeof value, `${entry.id ?? entry.effect} ${paramName} should be numeric`).toBe("number");
  expect(value as number, `${entry.id ?? entry.effect} ${paramName} should be <= ${PARAM_LIMIT}`).toBeLessThanOrEqual(PARAM_LIMIT);
}

describe("timeline audio-reactive safety limits", () => {
  const supportMap = readSupportedParamsFromDocs();

  it.each([
    ["public/timeline.release.json", timeline.sections as TimelineEntry[]],
  ])("keeps supported params explicit and <= 0.2 in %s", (_file, sections) => {
    for (const entry of allEntries(sections)) {
      const support = supportMap.get(entry.effect);
      if (!support) {
        continue;
      }

      if (support.audioReact) {
        expectParam(entry, "audioReact");
      }
      if (support.audioReactive) {
        expectParam(entry, "audioReactive");
      }
      if (support.kickImpulse) {
        expectParam(entry, "kickImpulse");
      }
      if (support.beatImpulse) {
        expectParam(entry, "beatImpulse");
      }
    }
  });
});
