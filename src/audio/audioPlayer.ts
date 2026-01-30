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
  private audio: HTMLAudioElement;
  private context: AudioContext;
  private analyser: AnalyserNode;
  private timeDomain: Uint8Array;
  private frequency: Uint8Array;
  private lastEnergy = 0;
  private smoothedEnergy = 0;
  private beatCooldown = 0;
  private lastUpdateTime = 0;
  private bandBins: { bass: [number, number]; mid: [number, number]; treble: [number, number] };

  constructor(src: string) {
    this.audio = new Audio();
    this.audio.src = src;
    this.audio.preload = "auto";

    this.context = new AudioContext();
    const source = this.context.createMediaElementSource(this.audio);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.bandBins = this.computeBandBins();
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
        reject(new Error("Unable to load audio track."));
      };
      const cleanup = () => {
        this.audio.removeEventListener("loadedmetadata", onLoaded);
        this.audio.removeEventListener("error", onError);
      };
      this.audio.addEventListener("loadedmetadata", onLoaded);
      this.audio.addEventListener("error", onError);
    });
  }

  async start(): Promise<void> {
    await this.context.resume();
    await this.audio.play();
    this.lastUpdateTime = this.audio.currentTime;
  }

  pause(): void {
    this.audio.pause();
  }

  async restart(): Promise<void> {
    this.audio.currentTime = 0;
    this.lastEnergy = 0;
    this.smoothedEnergy = 0;
    this.beatCooldown = 0;
    await this.start();
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  isPaused(): boolean {
    return this.audio.paused;
  }

  isEnded(): boolean {
    return this.audio.ended;
  }

  update(): AudioFeatures {
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    const rms = this.computeRms();
    const { bass, mid, treble } = this.computeBands();

    const now = this.audio.currentTime;
    const delta = Math.max(0, now - this.lastUpdateTime);
    this.lastUpdateTime = now;

    this.smoothedEnergy = this.smoothedEnergy * 0.9 + rms * 0.1;
    const deltaEnergy = rms - this.smoothedEnergy;
    const threshold = 0.08;
    let beat = false;
    let beatStrength = 0;

    this.beatCooldown = Math.max(0, this.beatCooldown - delta);
    if (deltaEnergy > threshold && this.beatCooldown <= 0) {
      beat = true;
      beatStrength = clamp((deltaEnergy - threshold) / 0.25, 0, 1);
      this.beatCooldown = 0.2;
    }

    this.lastEnergy = rms;

    return {
      timeDomain: this.timeDomain,
      frequency: this.frequency,
      rms,
      bass,
      mid,
      treble,
      beat,
      beatStrength
    };
  }

  dispose(): void {
    this.audio.pause();
    this.audio.src = "";
    this.context.close();
  }

  private computeRms(): number {
    let sum = 0;
    for (let i = 0; i < this.timeDomain.length; i += 1) {
      const v = (this.timeDomain[i] - 128) / 128;
      sum += v * v;
    }
    return Math.sqrt(sum / this.timeDomain.length);
  }

  private computeBandBins(): { bass: [number, number]; mid: [number, number]; treble: [number, number] } {
    const nyquist = this.context.sampleRate / 2;
    const binSize = nyquist / this.frequency.length;
    const toBin = (hz: number) => Math.min(this.frequency.length - 1, Math.floor(hz / binSize));
    return {
      bass: [toBin(20), toBin(140)],
      mid: [toBin(140), toBin(2000)],
      treble: [toBin(2000), toBin(6000)]
    };
  }

  private computeBands(): { bass: number; mid: number; treble: number } {
    const average = (range: [number, number]) => {
      const [start, end] = range;
      let total = 0;
      let count = 0;
      for (let i = start; i <= end; i += 1) {
        total += this.frequency[i];
        count += 1;
      }
      return count > 0 ? total / count / 255 : 0;
    };
    return {
      bass: average(this.bandBins.bass),
      mid: average(this.bandBins.mid),
      treble: average(this.bandBins.treble)
    };
  }
}
