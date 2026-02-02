import { AudioSource } from "./audioSource";
import {
  DEFAULT_FFT_SIZE,
  computeBands,
  computeRms,
  createBeatDetector,
  createEmptyAudioFeatures
} from "./features";

export class MicAudioSource implements AudioSource {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private timeDomain = new Uint8Array(DEFAULT_FFT_SIZE);
  private frequency = new Uint8Array(DEFAULT_FFT_SIZE / 2);
  private beatDetector = createBeatDetector();
  private lastUpdateTime = 0;
  private ready = false;

  async start(): Promise<void> {
    if (this.context) {
      await this.context.resume();
      return;
    }
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = DEFAULT_FFT_SIZE;
    this.timeDomain = new Uint8Array(this.analyser.fftSize);
    this.frequency = new Uint8Array(this.analyser.frequencyBinCount);
    this.beatDetector = createBeatDetector();
    this.lastUpdateTime = this.context.currentTime;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;
    this.source = this.context.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    this.ready = true;
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.source?.disconnect();
    this.source = null;
    this.analyser?.disconnect();
    this.analyser = null;
    this.context?.close();
    this.context = null;
    this.ready = false;
  }

  getTimeSeconds(): number {
    return this.context?.currentTime ?? 0;
  }

  getFeatures() {
    if (!this.ready || !this.context || !this.analyser) {
      return createEmptyAudioFeatures(this.timeDomain.length, this.frequency.length);
    }
    this.analyser.getByteTimeDomainData(this.timeDomain);
    this.analyser.getByteFrequencyData(this.frequency);

    const rms = computeRms(this.timeDomain);
    const { bass, mid, treble } = computeBands(this.frequency, this.context.sampleRate);
    const now = this.context.currentTime;
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
}
