import { clamp, lerp } from "../util/math";

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

export type AudioConfig = {
  src: string;
  offset: number;
};

export class AudioPlayer {
  private analyser: AnalyserNode;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private lastEnergy = 0;
  private lastBeatTime = 0;
  private beatStrength = 0;

  private constructor(
    private audio: HTMLAudioElement,
    private ctx: AudioContext,
    analyser: AnalyserNode
  ) {
    this.analyser = analyser;
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
  }

  static async create({ src }: AudioConfig): Promise<AudioPlayer> {
    const audio = new Audio();
    audio.src = src;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error("Failed to load audio."));
      };
      const cleanup = () => {
        audio.removeEventListener("canplaythrough", onReady);
        audio.removeEventListener("error", onError);
      };
      audio.addEventListener("canplaythrough", onReady, { once: true });
      audio.addEventListener("error", onError, { once: true });
    });

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    return new AudioPlayer(audio, ctx, analyser);
  }

  get duration(): number {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }

  get isPlaying(): boolean {
    return !this.audio.paused;
  }

  get ended(): boolean {
    return this.audio.ended;
  }

  async play(): Promise<void> {
    await this.ctx.resume();
    await this.audio.play();
  }

  async restart(): Promise<void> {
    this.audio.currentTime = 0;
    await this.play();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  dispose(): void {
    this.stop();
    this.ctx.close();
  }

  update(): AudioFeatures {
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    let rms = 0;
    for (let i = 0; i < this.timeDomain.length; i += 1) {
      const normalized = (this.timeDomain[i] - 128) / 128;
      rms += normalized * normalized;
    }
    rms = Math.sqrt(rms / this.timeDomain.length);

    const { bass, mid, treble } = this.computeBands();
    const energy = clamp(rms * 0.6 + bass * 0.8, 0, 1);
    const delta = energy - this.lastEnergy;
    const now = this.audio.currentTime;
    const cooldown = 0.28;
    let beat = false;
    let beatStrength = 0;
    if (delta > 0.12 && now - this.lastBeatTime > cooldown) {
      beat = true;
      this.lastBeatTime = now;
      beatStrength = clamp(delta * 2.4 + bass * 0.6, 0, 1);
    }

    this.lastEnergy = lerp(this.lastEnergy, energy, 0.3);
    this.beatStrength = lerp(this.beatStrength, beatStrength, 0.4);

    return {
      timeDomain: this.timeDomain,
      frequency: this.frequency,
      rms: clamp(rms, 0, 1),
      bass,
      mid,
      treble,
      beat,
      beatStrength: this.beatStrength
    };
  }

  private computeBands(): { bass: number; mid: number; treble: number } {
    const binCount = this.frequency.length;
    const sampleRate = this.ctx.sampleRate;
    const nyquist = sampleRate / 2;
    const bassMax = 140;
    const midMax = 2000;
    const trebleMax = 6000;

    let bassSum = 0;
    let bassCount = 0;
    let midSum = 0;
    let midCount = 0;
    let trebleSum = 0;
    let trebleCount = 0;

    for (let i = 0; i < binCount; i += 1) {
      const freq = (i / binCount) * nyquist;
      const value = this.frequency[i] / 255;
      if (freq <= bassMax) {
        bassSum += value;
        bassCount += 1;
      } else if (freq <= midMax) {
        midSum += value;
        midCount += 1;
      } else if (freq <= trebleMax) {
        trebleSum += value;
        trebleCount += 1;
      }
    }

    return {
      bass: bassCount ? clamp(bassSum / bassCount, 0, 1) : 0,
      mid: midCount ? clamp(midSum / midCount, 0, 1) : 0,
      treble: trebleCount ? clamp(trebleSum / trebleCount, 0, 1) : 0
    };
  }
}
