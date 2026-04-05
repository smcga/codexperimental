import { describe, expect, it } from "vitest";
import { AudioFeatures } from "./audioPlayer";
import { createManualBeatTrigger } from "./manualBeatTrigger";

const createFeatures = (overrides: Partial<AudioFeatures> = {}): AudioFeatures => ({
  timeDomain: new Uint8Array(8),
  frequency: new Uint8Array(4),
  rms: 0.2,
  bass: 0.2,
  mid: 0.2,
  treble: 0.2,
  beat: false,
  beatStrength: 0.1,
  impactStrength: 0,
  ...overrides
});

describe("ManualBeatTrigger", () => {
  it("injects a beat pulse on trigger", () => {
    const trigger = createManualBeatTrigger();
    const base = createFeatures();

    trigger.trigger(12);
    const injected = trigger.apply(base, 12);

    expect(injected.beat).toBe(true);
    expect(injected.beatStrength).toBe(1);
    expect(injected.impactStrength).toBe(1);
  });

  it("decays beat strength over a short window", () => {
    const trigger = createManualBeatTrigger();
    const base = createFeatures();

    trigger.trigger(3);
    trigger.apply(base, 3);
    const decayed = trigger.apply(base, 3.08);

    expect(decayed.beat).toBe(false);
    expect(decayed.beatStrength).toBeGreaterThan(0.4);
    expect(decayed.beatStrength).toBeLessThan(0.6);
  });

  it("preserves stronger detected beat values", () => {
    const trigger = createManualBeatTrigger();
    const base = createFeatures({ beatStrength: 0.95, beat: true, impactStrength: 0.8 });

    trigger.trigger(5);
    const merged = trigger.apply(base, 5.1);

    expect(merged.beat).toBe(true);
    expect(merged.beatStrength).toBe(0.95);
    expect(merged.impactStrength).toBe(0.8);
  });
});
