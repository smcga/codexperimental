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

export class AudioPlayer {
  private audio: HTMLAudioElement;
  private context: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private lastRms = 0;
  private lastBeatTime = -Infinity;
  private bassRange: [number, number] = [0, 0];
  private midRange: [number, number] = [0, 0];
  private trebleRange: [number, number] = [0, 0];
  private hasStarted = false;
  onStarted?: () => void;

  constructor(src: string) {
    this.audio = new Audio();
    this.audio.src = src;
    this.audio.preload = "auto";
    this.audio.crossOrigin = "anonymous";
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.source = this.context.createMediaElementSource(this.audio);
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async load(): Promise<void> {
    if (this.audio.readyState >= 1) {
      this.configureFrequencyRanges();
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
        this.configureFrequencyRanges();
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

  private configureFrequencyRanges(): void {
    const nyquist = this.context.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;
    const hzPerBin = nyquist / binCount;

    const bandToIndex = (hz: number) => Math.min(binCount - 1, Math.max(0, Math.floor(hz / hzPerBin)));
    this.bassRange = [bandToIndex(20), bandToIndex(250)];
    this.midRange = [bandToIndex(250), bandToIndex(2000)];
    this.trebleRange = [bandToIndex(2000), bandToIndex(8000)];
  }

  async play(): Promise<void> {
    await this.context.resume();
    await this.audio.play();
    if (!this.hasStarted) {
      this.hasStarted = true;
      this.onStarted?.();
    }
  }

  pause(): void {
    this.audio.pause();
  }


  setVolume(volume: number): void {
    this.audio.volume = clamp(volume, 0, 1);
  }

  setLoop(loop: boolean): void {
    this.audio.loop = loop;
  }

  seek(time: number): void {
    const duration = this.duration;
    const target = duration ? clamp(time, 0, duration) : Math.max(0, time);
    this.audio.currentTime = target;
  }

  async restart(): Promise<void> {
    this.audio.currentTime = 0;
    this.lastRms = 0;
    this.lastBeatTime = -Infinity;
    await this.play();
  }

  destroy(): void {
    this.audio.pause();
    this.audio.src = "";
    this.context.close();
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get duration(): number {
    return this.audio.duration || 0;
  }

  get outputLatency(): number {
    const contextWithOutputLatency = this.context as AudioContext & { outputLatency?: number };
    const outputLatency = Number.isFinite(contextWithOutputLatency.outputLatency)
      ? (contextWithOutputLatency.outputLatency as number)
      : 0;
    const baseLatency = Number.isFinite(this.context.baseLatency) ? this.context.baseLatency : 0;
    return Math.max(0, outputLatency + baseLatency);
  }

  get ended(): boolean {
    return this.audio.ended;
  }

  get paused(): boolean {
    return this.audio.paused;
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
