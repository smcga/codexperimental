import { describe, expect, it } from "vitest";
import { effectManifests } from "./manifest";
import { effectChronologyEntries, getSortedEffectChronology, validateEffectChronologyCoverage } from "./effectChronology";

describe("effect chronology", () => {
  it("covers the full effect registry exactly once", () => {
    const { missing, extra } = validateEffectChronologyCoverage();
    expect(missing).toEqual([]);
    expect(extra).toEqual([]);

    const registryCount = effectManifests.length;
    expect(effectChronologyEntries).toHaveLength(registryCount);
    expect(new Set(effectChronologyEntries.map((entry) => entry.key)).size).toBe(registryCount);
  });

  it("sorts chronologically by year then key", () => {
    const sorted = getSortedEffectChronology();
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous.yearFit === current.yearFit) {
        expect(previous.key.localeCompare(current.key)).toBeLessThanOrEqual(0);
      } else {
        expect(previous.yearFit).toBeLessThanOrEqual(current.yearFit);
      }
    }
  });
});
