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
};

export class AudioPlayer {
  readonly audio: HTMLAudioElement;
  readonly context: AudioContext;
  readonly analyser: AnalyserNode;
  readonly timeDomain: Uint8Array;
  readonly frequency: Uint8Array;

  private lastEnergy = 0;
  private beatCooldown = 0;
  private lastUpdateTime = 0;
  private offset = 0;

  constructor(src: string, offset = 0) {
    this.audio = new Audio();
    this.audio.src = src;
    this.audio.preload = "auto";
    this.audio.crossOrigin = "anonymous";

    this.context = new AudioContext();
    const source = this.context.createMediaElementSource(this.audio);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.offset = offset;
  }

  async load(): Promise<void> {
    if (this.audio.readyState >= 1) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Failed to load audio source"));
      };
      const cleanup = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
      };
      this.audio.addEventListener("loadedmetadata", onLoaded);
      this.audio.addEventListener("error", onError);
    });
  }

  async play(): Promise<void> {
    await this.context.resume();
    await this.audio.play();
    this.lastUpdateTime = this.context.currentTime;
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  restart(): void {
    this.audio.currentTime = 0;
    this.lastEnergy = 0;
    this.beatCooldown = 0;
    this.lastUpdateTime = this.context.currentTime;
  }

  setOffset(offset: number): void {
    this.offset = offset;
  }

  get demoTime(): number {
    return this.audio.currentTime + this.offset;
  }

  get isEnded(): boolean {
    return this.audio.ended;
  }

  get isPaused(): boolean {
    return this.audio.paused;
  }

  get duration(): number {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  updateFeatures(): AudioFeatures {
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    let sumSquares = 0;
    for (let i = 0; i < this.timeDomain.length; i += 1) {
      const normalized = (this.timeDomain[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.timeDomain.length);

    const { bass, mid, treble } = this.computeBands();

    const now = this.context.currentTime;
    const delta = now - this.lastUpdateTime;
    this.lastUpdateTime = now;
    this.beatCooldown = Math.max(0, this.beatCooldown - delta);

    const energyDelta = rms - this.lastEnergy;
    const beatThreshold = 0.12;
    let beat = false;
    let beatStrength = 0;
    if (energyDelta > beatThreshold && this.beatCooldown <= 0) {
      beat = true;
      beatStrength = clamp(energyDelta * 2.5, 0, 1);
      this.beatCooldown = 0.22;
    }

    this.lastEnergy = rms * 0.7 + this.lastEnergy * 0.3;

    return {
      timeDomain: this.timeDomain,
      frequency: this.frequency,
      rms: clamp(rms, 0, 1),
      bass,
      mid,
      treble,
      beat,
      beatStrength
    };
  }

  private computeBands(): { bass: number; mid: number; treble: number } {
    const nyquist = this.context.sampleRate / 2;
    const binSize = nyquist / this.frequency.length;

    let bassTotal = 0;
    let midTotal = 0;
    let trebleTotal = 0;
    let bassCount = 0;
    let midCount = 0;
    let trebleCount = 0;

    for (let i = 0; i < this.frequency.length; i += 1) {
      const freq = i * binSize;
      const value = this.frequency[i] / 255;
      if (freq < 140) {
        bassTotal += value;
        bassCount += 1;
      } else if (freq < 1400) {
        midTotal += value;
        midCount += 1;
      } else if (freq < 6000) {
        trebleTotal += value;
        trebleCount += 1;
      }
    }

    return {
      bass: bassCount ? clamp(bassTotal / bassCount, 0, 1) : 0,
      mid: midCount ? clamp(midTotal / midCount, 0, 1) : 0,
      treble: trebleCount ? clamp(trebleTotal / trebleCount, 0, 1) : 0
    };
  }
}
