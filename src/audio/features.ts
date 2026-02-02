import { clamp } from "../util/math";
import { AudioFeatures } from "./audioSource";

export const DEFAULT_FFT_SIZE = 2048;

export type BandConfig = {
  bass: [number, number];
  mid: [number, number];
  treble: [number, number];
};

export const DEFAULT_BANDS: BandConfig = {
  bass: [20, 250],
  mid: [250, 2000],
  treble: [2000, 8000]
};

const BEAT_THRESHOLD = 0.08;
const BEAT_COOLDOWN_SECONDS = 0.2;

export function computeRms(buffer: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const sample = (buffer[i] - 128) / 128;
    sum += sample * sample;
  }
  return Math.sqrt(sum / buffer.length);
}

function computeBandEnergy(
  frequency: Uint8Array,
  [start, end]: [number, number]
): number {
  let sum = 0;
  let count = 0;
  for (let i = start; i <= end; i += 1) {
    sum += frequency[i];
    count += 1;
  }
  if (count === 0) {
    return 0;
  }
  return clamp(sum / count / 255, 0, 1);
}

export function computeBands(
  frequency: Uint8Array,
  sampleRate: number,
  bands: BandConfig = DEFAULT_BANDS
): { bass: number; mid: number; treble: number } {
  const nyquist = sampleRate / 2;
  const binCount = frequency.length;
  const hzPerBin = nyquist / binCount;
  const bandToIndex = (hz: number) => Math.min(binCount - 1, Math.max(0, Math.floor(hz / hzPerBin)));

  const bassRange: [number, number] = [bandToIndex(bands.bass[0]), bandToIndex(bands.bass[1])];
  const midRange: [number, number] = [bandToIndex(bands.mid[0]), bandToIndex(bands.mid[1])];
  const trebleRange: [number, number] = [bandToIndex(bands.treble[0]), bandToIndex(bands.treble[1])];

  return {
    bass: computeBandEnergy(frequency, bassRange),
    mid: computeBandEnergy(frequency, midRange),
    treble: computeBandEnergy(frequency, trebleRange)
  };
}

export function createBeatDetector(
  threshold = BEAT_THRESHOLD,
  cooldownSeconds = BEAT_COOLDOWN_SECONDS
): (rms: number, dt: number) => { beat: boolean; strength: number } {
  let smoothedRms = 0;
  let cooldownRemaining = 0;

  return (rms: number, dt: number) => {
    const safeDt = Math.max(0, dt);
    const delta = rms - smoothedRms;
    const canBeat = cooldownRemaining <= 0;
    const beat = delta > threshold && canBeat;
    if (beat) {
      cooldownRemaining = cooldownSeconds;
    } else {
      cooldownRemaining = Math.max(0, cooldownRemaining - safeDt);
    }
    const strength = clamp(delta * 2.5, 0, 1);
    smoothedRms = smoothedRms * 0.8 + rms * 0.2;
    return { beat, strength };
  };
}

export function createEmptyAudioFeatures(
  timeDomainSize = DEFAULT_FFT_SIZE,
  frequencySize = DEFAULT_FFT_SIZE / 2
): AudioFeatures {
  return {
    timeDomain: new Uint8Array(timeDomainSize),
    frequency: new Uint8Array(frequencySize),
    rms: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    beat: false,
    beatStrength: 0,
    impactStrength: 0
  };
}
