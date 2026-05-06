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
const START_SCHEDULE_LEAD_SECONDS = 0.05;

export class AudioPlayer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private gain: GainNode;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private lastRms = 0;
  private lastBeatTime = -Infinity;
  private bassRange: [number, number] = [0, 0];
  private midRange: [number, number] = [0, 0];
  private trebleRange: [number, number] = [0, 0];
  private hasStarted = false;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private src: string;
  private startedAt = 0;
  private pausedAt = 0;
  private playing = false;
  private stoppingSource = false;
  private loop = false;
  onStarted?: () => void;

  constructor(src: string) {
    this.src = src;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.gain = this.context.createGain();
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.analyser.connect(this.gain);
    this.gain.connect(this.context.destination);
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.configureFrequencyRanges();
  }

  async load(): Promise<void> {
    if (this.buffer) {
      return;
    }
    await this.unlock();
    this.buffer = await this.loadBuffer(this.src);
    this.configureFrequencyRanges();
    if (this.pausedAt > this.buffer.duration) {
      this.pausedAt = this.buffer.duration;
    }
  }

  async unlock(): Promise<void> {
    if (this.context.state === "running") {
      return;
    }
    await this.context.resume();
  }

  private async loadBuffer(src: string): Promise<AudioBuffer> {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio ${src}: ${response.status}`);
    }
    const encodedAudio = await response.arrayBuffer();
    return await this.decodeAudioData(encodedAudio);
  }

  private async decodeAudioData(encodedAudio: ArrayBuffer): Promise<AudioBuffer> {
    const decoded = await this.context.decodeAudioData(encodedAudio);
    if (!decoded || decoded.duration <= 0) {
      throw new Error("Decoded audio buffer is empty");
    }
    return decoded;
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

  private getAudibleContextTime(): number {
    const getOutputTimestamp = this.context.getOutputTimestamp?.bind(this.context);
    if (getOutputTimestamp) {
      const ts = getOutputTimestamp();
      if (Number.isFinite(ts.contextTime) && Number.isFinite(ts.performanceTime)) {
        const elapsedSeconds = Math.max(0, (performance.now() - ts.performanceTime) / 1000);
        return ts.contextTime + elapsedSeconds;
      }
    }
    return this.context.currentTime;
  }

  private clampSeekTime(time: number): number {
    const normalized = Math.max(0, time);
    if (!this.buffer) {
      return normalized;
    }
    return clamp(normalized, 0, this.buffer.duration);
  }

  private stopSource(): void {
    if (!this.source) {
      return;
    }
    this.stoppingSource = true;
    this.source.onended = null;
    this.source.stop();
    this.source.disconnect();
    this.source = null;
    this.stoppingSource = false;
  }

  private createSource(offsetSeconds: number): AudioBufferSourceNode {
    if (!this.buffer) {
      throw new Error("Audio not loaded");
    }
    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.loop = this.loop;
    source.connect(this.analyser);
    source.onended = () => {
      if (this.stoppingSource) {
        return;
      }
      this.playing = false;
      this.source = null;
      this.pausedAt = this.buffer?.duration ?? this.pausedAt;
    };
    const startAt = this.context.currentTime + START_SCHEDULE_LEAD_SECONDS;
    this.startedAt = startAt - offsetSeconds;
    source.start(startAt, offsetSeconds);
    this.source = source;
    return source;
  }

  async play(): Promise<void> {
    if (!this.buffer) {
      throw new Error("Audio not loaded");
    }
    if (this.playing) {
      return;
    }
    await this.unlock();
    const offset = this.buffer && this.pausedAt >= this.buffer.duration ? 0 : this.pausedAt;
    this.createSource(offset);
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
    this.stopSource();
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
    this.pausedAt = this.clampSeekTime(time);
    if (!this.playing) {
      return;
    }
    this.stopSource();
    this.createSource(this.pausedAt);
    this.playing = true;
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
    this.stopSource();
    this.playing = false;
    this.buffer = null;
    this.context.close();
  }

  get currentTime(): number {
    if (!this.playing) {
      return this.pausedAt;
    }
    const rawTime = Math.max(0, this.getAudibleContextTime() - this.startedAt);
    if (!this.buffer) {
      return rawTime;
    }
    return Math.min(rawTime, this.buffer.duration);
  }

  get duration(): number {
    return this.buffer?.duration ?? 0;
  }

  get ended(): boolean {
    if (!this.buffer) {
      return false;
    }
    return !this.playing && this.pausedAt >= this.buffer.duration;
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
