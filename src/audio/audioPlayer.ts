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

const DEFAULT_FFT_SIZE = 2048;
const BEAT_THRESHOLD = 0.08;
const BEAT_COOLDOWN = 0.2;
const START_LEAD_SECONDS = 0.03;

export class AudioPlayer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private gain: GainNode;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private lastRms = 0;
  private lastBeatTime = -Infinity;
  private bassRange: [number, number] = [0, 0];
  private midRange: [number, number] = [0, 0];
  private trebleRange: [number, number] = [0, 0];
  private hasStarted = false;
  private startedAt = 0;
  private pausedAt = 0;
  private playing = false;
  private intentionallyStoppingSource = false;
  private outputGraphConnected = false;
  private src: string;
  private loop = false;
  onStarted?: () => void;

  constructor(src: string) {
    this.src = src;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.gain = this.context.createGain();
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.ensureOutputGraphConnected();
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.configureFrequencyRanges();
  }

  async load(): Promise<void> {
    if (this.buffer) {
      return;
    }
    const response = await fetch(this.src);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status}`);
    }
    const audioData = await response.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(audioData);
  }

  private configureFrequencyRanges(): void {
    const nyquist = this.context.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;
    const hzPerBin = nyquist / binCount;

    const bandToIndex = (hz: number) => Math.min(binCount - 1, Math.max(0, Math.floor(hz / hzPerBin)));
    this.bassRange = [bandToIndex(20), bandToIndex(250)];
    this.midRange = [bandToIndex(250), bandToIndex(2000)];
    this.trebleRange = [bandToIndex(2000), bandToIndex(8000)];
  }

  private clampPlaybackTime(time: number): number {
    const bounded = Math.max(0, time);
    if (!this.buffer) {
      return bounded;
    }
    return Math.min(bounded, this.buffer.duration);
  }

  private ensureOutputGraphConnected(): void {
    if (this.outputGraphConnected) {
      return;
    }
    this.gain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this.outputGraphConnected = true;
  }

  private createAndConnectSource(): AudioBufferSourceNode {
    if (!this.buffer) {
      throw new Error("Audio buffer is not loaded");
    }
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = this.loop;
    source.connect(this.gain);
    source.onended = () => {
      if (this.intentionallyStoppingSource) {
        return;
      }
      this.playing = false;
      this.pausedAt = this.buffer?.duration ?? this.pausedAt;
      this.source = null;
    };
    this.source = source;
    return source;
  }

  private stopCurrentSource(): void {
    if (!this.source) {
      return;
    }
    this.intentionallyStoppingSource = true;
    const sourceToStop = this.source;
    this.source = null;
    sourceToStop.onended = null;
    try {
      sourceToStop.stop();
    } catch {
      // Source may already be stopped or not yet started.
    }
    sourceToStop.disconnect();
    this.intentionallyStoppingSource = false;
  }

  async play(): Promise<void> {
    if (!this.buffer) {
      throw new Error("Audio not loaded. Call load() before play().");
    }
    if (this.playing) {
      return;
    }
    await this.context.resume();
    const source = this.createAndConnectSource();
    const startAt = this.context.currentTime + START_LEAD_SECONDS;
    let offset = this.clampPlaybackTime(this.pausedAt);
    if (this.buffer.duration > 0 && offset >= this.buffer.duration) {
      offset = 0;
    }
    this.startedAt = startAt - offset;
    source.start(startAt, offset);
    this.pausedAt = offset;
    this.playing = true;
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.onStarted?.();
    }
  }

  pause(): void {
    if (!this.playing) {
      return;
    }
    this.pausedAt = this.currentTime;
    this.stopCurrentSource();
    this.playing = false;
  }

  setVolume(volume: number): void {
    this.gain.gain.value = clamp(volume, 0, 1);
  }

  setLoop(loop: boolean): void {
    this.loop = loop;
    if (this.source) {
      this.source.loop = loop;
    }
  }

  seek(time: number): void {
    const target = this.clampPlaybackTime(time);
    this.pausedAt = target;
    if (this.playing) {
      this.stopCurrentSource();
      const source = this.createAndConnectSource();
      const startAt = this.context.currentTime + START_LEAD_SECONDS;
      this.startedAt = startAt - target;
      source.start(startAt, target);
    }
  }

  async restart(): Promise<void> {
    this.lastRms = 0;
    this.lastBeatTime = -Infinity;
    this.seek(0);
    if (!this.playing) {
      await this.play();
    }
  }

  destroy(): void {
    this.stopCurrentSource();
    this.playing = false;
    this.context.close();
  }

  private getAudibleContextTime(): number {
    if (typeof this.context.getOutputTimestamp === "function") {
      const timestamp = this.context.getOutputTimestamp();
      const elapsed = (performance.now() - timestamp.performanceTime) / 1000;
      return timestamp.contextTime + elapsed;
    }
    return this.context.currentTime;
  }

  get currentTime(): number {
    if (!this.playing) {
      return this.pausedAt;
    }
    const audibleContextTime = this.getAudibleContextTime();
    const time = Math.max(0, audibleContextTime - this.startedAt);
    return this.buffer ? Math.min(time, this.buffer.duration) : time;
  }

  get duration(): number {
    return this.buffer?.duration ?? 0;
  }

  get ended(): boolean {
    return !this.playing && this.buffer !== null && this.pausedAt >= this.buffer.duration;
  }

  get paused(): boolean {
    return !this.playing;
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

  private computeRms(buffer: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      const sample = (buffer[i] - 128) / 128;
      sum += sample * sample;
    }
    return Math.sqrt(sum / buffer.length);
  }

  private computeBandEnergy([start, end]: [number, number]): number {
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
}
