import { clamp } from "../util/math";
import { AudioSource } from "./audioSource";
import { DEFAULT_FFT_SIZE, computeBands, computeRms, createBeatDetector } from "./features";

export class AudioPlayer implements AudioSource {
  private audio: HTMLAudioElement;
  private context: AudioContext;
  private analyser: AnalyserNode;
  private source: MediaElementAudioSourceNode;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private beatDetector = createBeatDetector();
  private lastUpdateTime = 0;

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

  async start(): Promise<void> {
    await this.context.resume();
    await this.audio.play();
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
    this.beatDetector = createBeatDetector();
    this.lastUpdateTime = 0;
    await this.start();
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

  get ended(): boolean {
    return this.audio.ended;
  }

  get paused(): boolean {
    return this.audio.paused;
  }

  getTimeSeconds(): number {
    return this.currentTime;
  }

  getFeatures() {
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    const rms = this.computeRms(this.timeDomain);
    const { bass, mid, treble } = computeBands(this.frequency, this.context.sampleRate);
    const now = this.getTimeSeconds();
    const dt = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    const { beat, strength } = this.beatDetector(rms, dt);

    return {
      timeDomain: this.timeDomain,
      frequency: this.frequency,
      rms,
      bass,
      mid,
      treble,
      beat,
      beatStrength: strength,
      impactStrength: 0
    };
  }

  private computeRms(buffer: Uint8Array): number {
    return computeRms(buffer);
  }
}
