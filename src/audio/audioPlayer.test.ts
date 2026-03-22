import { describe, expect, it } from "vitest";
import { getProceduralMusicStep, getProceduralMusicStepDuration } from "./audioPlayer";

describe("procedural music helpers", () => {
  it("uses deterministic 16th-note timing", () => {
    expect(getProceduralMusicStepDuration()).toBeCloseTo(60 / 124 / 4);
  });

  it("starts each bar with a kick, hat, bass note, and lead accent", () => {
    const step = getProceduralMusicStep(0);
    expect(step.kick).toBe(true);
    expect(step.hat).toBe(true);
    expect(step.bassMidi).toBe(45);
    expect(step.leadMidi).toBe(64);
    expect(step.accent).toBeCloseTo(1);
  });

  it("keeps off-beats lighter and can leave melodic gaps", () => {
    const step = getProceduralMusicStep(1);
    expect(step.kick).toBe(false);
    expect(step.hat).toBe(false);
    expect(step.bassMidi).toBeNull();
    expect(step.leadMidi).toBeNull();
    expect(step.accent).toBeCloseTo(0.45);
  });

  it("rotates the bass root each bar", () => {
    expect(getProceduralMusicStep(16).bassMidi).toBe(48);
    expect(getProceduralMusicStep(32).bassMidi).toBe(50);
    expect(getProceduralMusicStep(48).bassMidi).toBe(43);
    expect(getProceduralMusicStep(64).bassMidi).toBe(45);
  });
});
