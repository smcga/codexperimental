import { clamp } from "../util/math";

export type AudioFeatures = {
  timeDomain: Uint8Array;
  frequency: Uint8Array;
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  beat: boolean;
  beatStrength: number;
  impactStrength: number;
};

export type AudioPlayback = {
  onStarted?: () => void;
  load(): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  restart(): Promise<void>;
  destroy(): void;
  updateFeatures(): AudioFeatures;
  readonly currentTime: number;
  readonly duration: number;
  readonly ended: boolean;
  readonly paused: boolean;
};

export type ProceduralMusicStep = {
  kick: boolean;
  hat: boolean;
  bassMidi: number | null;
  leadMidi: number | null;
  accent: number;
};

const DEFAULT_FFT_SIZE = 2048;
const BEAT_THRESHOLD = 0.08;
const BEAT_COOLDOWN = 0.2;
const DEFAULT_PROCEDURAL_DURATION = 215;
const PROCEDURAL_BPM = 124;
const STEPS_PER_BEAT = 4;
const SONG_LOOKAHEAD = 0.35;
const ROOT_SEQUENCE = [45, 48, 50, 43];
const MAJOR_SCALE = [0, 2, 4, 7, 9, 7, 4, 2];
const LEAD_PATTERN: Array<number | null> = [7, null, 9, 11, 12, 11, 9, null, 7, null, 4, 7, 9, 7, 4, null];

function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function getProceduralMusicStepDuration(): number {
  return 60 / PROCEDURAL_BPM / STEPS_PER_BEAT;
}

export function getProceduralMusicStep(stepIndex: number): ProceduralMusicStep {
  const normalizedStep = Math.max(0, Math.floor(stepIndex));
  const bar = Math.floor(normalizedStep / 16);
  const stepInBar = normalizedStep % 16;
  const root = ROOT_SEQUENCE[bar % ROOT_SEQUENCE.length];
  const scaleDegree = MAJOR_SCALE[(Math.floor(stepInBar / 2) + bar) % MAJOR_SCALE.length];
  const leadOffset = LEAD_PATTERN[stepInBar];

  return {
    kick: stepInBar % 4 === 0,
    hat: stepInBar % 2 === 0,
    bassMidi: stepInBar % 4 === 0 || stepInBar === 6 || stepInBar === 14 ? root + (stepInBar % 8 === 6 ? 7 : 0) : null,
    leadMidi: leadOffset === null ? null : root + 12 + leadOffset + (stepInBar >= 12 ? 12 : 0),
    accent: clamp((stepInBar === 0 ? 1 : 0.45) + (scaleDegree / 12) * 0.18, 0.35, 1)
  };
}

abstract class AnalyserPlayback implements AudioPlayback {
  protected context: AudioContext;
  protected analyser: AnalyserNode;
  protected timeDomain: Uint8Array;
  protected frequency: Uint8Array;
  protected lastRms = 0;
  protected lastBeatTime = -Infinity;
  protected bassRange: [number, number] = [0, 0];
  protected midRange: [number, number] = [0, 0];
  protected trebleRange: [number, number] = [0, 0];
  protected hasStarted = false;
  onStarted?: () => void;

  constructor() {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.configureFrequencyRanges();
  }

  protected connectToDestination(source: AudioNode): void {
    source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
  }

  protected markStarted(): void {
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;
    this.onStarted?.();
  }

  protected configureFrequencyRanges(): void {
    const nyquist = this.context.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;
    const hzPerBin = nyquist / binCount;

    const bandToIndex = (hz: number) => Math.min(binCount - 1, Math.max(0, Math.floor(hz / hzPerBin)));
    this.bassRange = [bandToIndex(20), bandToIndex(250)];
    this.midRange = [bandToIndex(250), bandToIndex(2000)];
    this.trebleRange = [bandToIndex(2000), bandToIndex(8000)];
  }

  protected resetFeatureTracking(): void {
    this.lastRms = 0;
    this.lastBeatTime = -Infinity;
  }

  updateFeatures(): AudioFeatures {
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    const rms = this.computeRms(this.timeDomain);
    const bass = this.computeBandEnergy(this.bassRange);
    const mid = this.computeBandEnergy(this.midRange);
    const treble = this.computeBandEnergy(this.trebleRange);

    const delta = rms - this.lastRms;
    const now = this.currentTime;
    const beat = delta > BEAT_THRESHOLD && now - this.lastBeatTime > BEAT_COOLDOWN;
    if (beat) {
      this.lastBeatTime = now;
    }
    const beatStrength = clamp(delta * 2.5, 0, 1);
    this.lastRms = this.lastRms * 0.8 + rms * 0.2;

    return {
      timeDomain: this.timeDomain,
      frequency: this.frequency,
      rms,
      bass,
      mid,
      treble,
      beat,
      beatStrength,
      impactStrength: 0
    };
  }

  protected computeRms(buffer: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const sample = (buffer[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / buffer.length);
  }

  protected computeBandEnergy([start, end]: [number, number]): number {
    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      sum += this.frequency[i];
      count += 1;
    }
    if (count === 0) {
      return 0;
    }
    return clamp(sum / count / 255, 0, 1);
  }

  abstract load(): Promise<void>;
  abstract play(): Promise<void>;
  abstract pause(): void;
  abstract seek(time: number): void;
  abstract restart(): Promise<void>;
  abstract destroy(): void;
  abstract get currentTime(): number;
  abstract get duration(): number;
  abstract get ended(): boolean;
  abstract get paused(): boolean;
}

export class AudioPlayer extends AnalyserPlayback {
  private audio: HTMLAudioElement;
  private source: MediaElementAudioSourceNode;

  constructor(src: string) {
    super();
    this.audio = new Audio();
    this.audio.src = src;
    this.audio.preload = "auto";
    this.audio.crossOrigin = "anonymous";
    this.source = this.context.createMediaElementSource(this.audio);
    this.connectToDestination(this.source);
  }

  async load(): Promise<void> {
    if (this.audio.readyState >= 1) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
        reject(new Error("Failed to load audio metadata"));
      };
      this.audio.addEventListener("loadedmetadata", onLoaded);
      this.audio.addEventListener("error", onError);
      this.audio.load();
    });
  }

  async play(): Promise<void> {
    await this.context.resume();
    await this.audio.play();
    this.markStarted();
  }

  pause(): void {
    this.audio.pause();
  }

  seek(time: number): void {
    const duration = this.duration;
    const target = duration ? clamp(time, 0, duration) : Math.max(0, time);
    this.audio.currentTime = target;
  }

  async restart(): Promise<void> {
    this.audio.currentTime = 0;
    this.resetFeatureTracking();
    await this.play();
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = "";
    void this.context.close();
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  get ended(): boolean {
    return this.audio.ended;
  }

  get paused(): boolean {
    return this.audio.paused;
  }
}

type ScheduledVoice = {
  stopTime: number;
  stop(): void;
};

export class ProceduralAudioPlayer extends AnalyserPlayback {
  private readonly durationSeconds: number;
  private readonly output: GainNode;
  private readonly leadBus: GainNode;
  private readonly bassBus: GainNode;
  private readonly drumBus: GainNode;
  private readonly noiseBuffer: AudioBuffer;
  private transportOrigin = 0;
  private pausedTime = 0;
  private playing = false;
  private scheduledUntil = 0;
  private voices: ScheduledVoice[] = [];

  constructor(durationSeconds = DEFAULT_PROCEDURAL_DURATION) {
    super();
    this.durationSeconds = Math.max(1, durationSeconds);
    this.output = this.context.createGain();
    this.output.gain.value = 0.7;
    this.leadBus = this.context.createGain();
    this.leadBus.gain.value = 0.25;
    this.bassBus = this.context.createGain();
    this.bassBus.gain.value = 0.32;
    this.drumBus = this.context.createGain();
    this.drumBus.gain.value = 0.4;
    this.leadBus.connect(this.output);
    this.bassBus.connect(this.output);
    this.drumBus.connect(this.output);
    this.connectToDestination(this.output);
    this.noiseBuffer = this.createNoiseBuffer();
  }

  async load(): Promise<void> {
    return Promise.resolve();
  }

  async play(): Promise<void> {
    if (this.ended) {
      this.pausedTime = 0;
    }
    await this.context.resume();
    this.transportOrigin = this.context.currentTime - this.pausedTime;
    this.playing = true;
    this.scheduledUntil = this.pausedTime;
    this.scheduleVoices();
    this.markStarted();
  }

  pause(): void {
    if (!this.playing) {
      return;
    }
    this.pausedTime = this.currentTime;
    this.playing = false;
    this.stopVoices();
    void this.context.suspend();
  }

  seek(time: number): void {
    const target = clamp(time, 0, this.durationSeconds);
    this.pausedTime = target;
    this.transportOrigin = this.context.currentTime - target;
    this.scheduledUntil = target;
    this.stopVoices();
    if (this.playing) {
      this.scheduleVoices();
    }
    this.resetFeatureTracking();
  }

  async restart(): Promise<void> {
    this.seek(0);
    await this.play();
  }

  destroy(): void {
    this.stopVoices();
    void this.context.close();
  }

  updateFeatures(): AudioFeatures {
    if (this.playing) {
      this.scheduleVoices();
    }
    return super.updateFeatures();
  }

  get currentTime(): number {
    if (!this.playing) {
      return this.pausedTime;
    }
    return clamp(this.context.currentTime - this.transportOrigin, 0, this.durationSeconds);
  }

  get duration(): number {
    return this.durationSeconds;
  }

  get ended(): boolean {
    return this.currentTime >= this.durationSeconds;
  }

  get paused(): boolean {
    return !this.playing;
  }

  private createNoiseBuffer(): AudioBuffer {
    const length = Math.max(1, Math.floor(this.context.sampleRate * 0.2));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private stopVoices(): void {
    this.voices.forEach((voice) => voice.stop());
    this.voices = [];
  }

  private pruneVoices(): void {
    const now = this.currentTime;
    this.voices = this.voices.filter((voice) => {
      if (voice.stopTime < now - 0.05) {
        voice.stop();
        return false;
      }
      return true;
    });
  }

  private scheduleVoices(): void {
    this.pruneVoices();
    if (!this.playing) {
      return;
    }
    const songNow = this.currentTime;
    const scheduleEnd = Math.min(this.durationSeconds, songNow + SONG_LOOKAHEAD);
    if (this.scheduledUntil < songNow) {
      this.scheduledUntil = songNow;
    }

    const stepDuration = getProceduralMusicStepDuration();
    let stepIndex = Math.floor(this.scheduledUntil / stepDuration);
    while (stepIndex * stepDuration < scheduleEnd) {
      const startTime = stepIndex * stepDuration;
      if (startTime >= this.scheduledUntil - 1e-6) {
        this.scheduleStep(stepIndex, startTime, stepDuration);
      }
      stepIndex += 1;
    }
    this.scheduledUntil = scheduleEnd;
  }

  private scheduleStep(stepIndex: number, songTime: number, stepDuration: number): void {
    const step = getProceduralMusicStep(stepIndex);
    const when = this.transportOrigin + songTime;
    const accent = step.accent;

    if (step.bassMidi !== null) {
      this.scheduleTone({
        frequency: midiToFrequency(step.bassMidi),
        when,
        duration: stepDuration * 1.8,
        type: "triangle",
        gain: 0.23 * accent,
        attack: 0.004,
        release: 0.08,
        destination: this.bassBus,
        detune: -3
      });
    }

    if (step.leadMidi !== null) {
      this.scheduleTone({
        frequency: midiToFrequency(step.leadMidi),
        when,
        duration: stepDuration * 0.92,
        type: "sawtooth",
        gain: 0.12 * accent,
        attack: 0.01,
        release: 0.12,
        destination: this.leadBus,
        detune: 5
      });
    }

    if (step.kick) {
      this.scheduleKick(when, 0.24 + accent * 0.08);
    }
    if (step.hat) {
      this.scheduleHat(when + stepDuration * 0.5, 0.06 + accent * 0.02);
    }
  }

  private scheduleTone(options: {
    frequency: number;
    when: number;
    duration: number;
    type: OscillatorType;
    gain: number;
    attack: number;
    release: number;
    destination: AudioNode;
    detune?: number;
  }): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const { frequency, when, duration, type, destination, attack, release } = options;
    const stopTime = when + duration + release;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, when);
    if (options.detune) {
      osc.detune.setValueAtTime(options.detune, when);
    }

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(options.gain, when + attack);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, options.gain * 0.55), when + duration);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(when);
    osc.stop(stopTime);

    this.voices.push({
      stopTime: stopTime - this.transportOrigin,
      stop: () => {
        try {
          osc.stop();
        } catch {
          // noop: the node may already be stopped.
        }
        osc.disconnect();
        gain.disconnect();
      }
    });
  }

  private scheduleKick(when: number, gainAmount: number): void {
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const stopTime = when + 0.22;

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, when);
    osc.frequency.exponentialRampToValueAtTime(38, stopTime);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainAmount, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(this.drumBus);
    osc.start(when);
    osc.stop(stopTime);

    this.voices.push({
      stopTime: stopTime - this.transportOrigin,
      stop: () => {
        try {
          osc.stop();
        } catch {
          // noop: the node may already be stopped.
        }
        osc.disconnect();
        gain.disconnect();
      }
    });
  }

  private scheduleHat(when: number, gainAmount: number): void {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();
    const stopTime = when + 0.08;

    source.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.setValueAtTime(4200, when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(gainAmount, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.drumBus);
    source.start(when);
    source.stop(stopTime);

    this.voices.push({
      stopTime: stopTime - this.transportOrigin,
      stop: () => {
        try {
          source.stop();
        } catch {
          // noop: the node may already be stopped.
        }
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      }
    });
  }
}

export function createAudioPlayback(options: {
  src: string;
  procedural: boolean;
  durationHint?: number;
}): AudioPlayback {
  if (options.procedural) {
    return new ProceduralAudioPlayer(options.durationHint ?? DEFAULT_PROCEDURAL_DURATION);
  }
  return new AudioPlayer(options.src);
}
