import { AudioFeatures } from "./audioPlayer";

const MANUAL_BEAT_WINDOW_SECONDS = 0.16;
const MANUAL_BEAT_PEAK_STRENGTH = 1.8;

export class ManualBeatTrigger {
  private pendingBeat = false;
  private lastTriggerTime = Number.NEGATIVE_INFINITY;

  trigger(time: number): void {
    this.lastTriggerTime = time;
    this.pendingBeat = true;
  }

  apply(features: AudioFeatures, time: number): AudioFeatures {
    const age = time - this.lastTriggerTime;
    const active = age >= 0 && age <= MANUAL_BEAT_WINDOW_SECONDS;
    const manualStrength = active ? (1 - age / MANUAL_BEAT_WINDOW_SECONDS) * MANUAL_BEAT_PEAK_STRENGTH : 0;
    const manualBeat = this.pendingBeat && active;
    this.pendingBeat = false;

    if (!manualBeat && manualStrength <= features.beatStrength) {
      return features;
    }

    return {
      ...features,
      beat: features.beat || manualBeat,
      beatStrength: Math.max(features.beatStrength, manualStrength),
      impactStrength: Math.max(features.impactStrength, manualStrength)
    };
  }
}

export const createManualBeatTrigger = (): ManualBeatTrigger => new ManualBeatTrigger();
