import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";

export const EFFECT_PREVIEW_AUDIO_START_TIME = 5 * 60 + 12.85;
export const EFFECT_PREVIEW_AUDIO_LOOP_START_TIME = 5 * 60 + 39.94;
export const EFFECT_PREVIEW_AUDIO_LOOP_END_TIME = 5 * 60 + 50.786;
export const EFFECT_PREVIEW_AUDIO_VOLUME = 0.2;

const EMPTY_AUDIO_FEATURES: AudioFeatures = {
  timeDomain: new Uint8Array(2048),
  frequency: new Uint8Array(1024),
  rms: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  beat: false,
  beatStrength: 0,
  impactStrength: 0
};

export function getEffectPreviewLoopTime(currentTime: number): number {
  return currentTime >= EFFECT_PREVIEW_AUDIO_LOOP_END_TIME ? EFFECT_PREVIEW_AUDIO_LOOP_START_TIME : currentTime;
}

export class EffectPreviewAudioController {
  private player: AudioPlayer | null = null;
  private loopIntervalHandle: number | null = null;
  private cachedFeatures: AudioFeatures = EMPTY_AUDIO_FEATURES;
  private lastFeaturesSampleAt = 0;

  constructor(private src: string) {}

  setSource(src: string): void {
    if (src === this.src) {
      return;
    }
    this.src = src;
    this.lastFeaturesSampleAt = 0;
    this.cachedFeatures = EMPTY_AUDIO_FEATURES;
    this.destroyPlayer();
  }

  async start(): Promise<void> {
    if (!this.player) {
      this.player = new AudioPlayer(this.src);
      await this.player.load();
      this.player.setVolume(EFFECT_PREVIEW_AUDIO_VOLUME);
    }
    this.lastFeaturesSampleAt = 0;
    this.cachedFeatures = EMPTY_AUDIO_FEATURES;

    this.player.seek(EFFECT_PREVIEW_AUDIO_START_TIME);

    try {
      await this.player.play();
    } catch {
      // Ignore autoplay rejections; preview rendering still runs with silent audio features.
    }

    this.startLoopWatch();
  }

  stop(): void {
    if (this.loopIntervalHandle !== null) {
      globalThis.clearInterval(this.loopIntervalHandle);
      this.loopIntervalHandle = null;
    }
    this.player?.pause();
  }

  destroy(): void {
    this.stop();
    this.destroyPlayer();
  }

  getPlaybackTime(): number {
    if (!this.player) {
      return EFFECT_PREVIEW_AUDIO_START_TIME;
    }
    return getEffectPreviewLoopTime(this.player.currentTime);
  }

  getFeatures(): AudioFeatures {
    if (!this.player) {
      return EMPTY_AUDIO_FEATURES;
    }
    const now = performance.now();
    if (now - this.lastFeaturesSampleAt >= 50) {
      this.cachedFeatures = this.player.updateFeatures();
      this.lastFeaturesSampleAt = now;
    }
    return this.cachedFeatures;
  }

  private startLoopWatch(): void {
    if (this.loopIntervalHandle !== null) {
      globalThis.clearInterval(this.loopIntervalHandle);
      this.loopIntervalHandle = null;
    }

    this.loopIntervalHandle = globalThis.setInterval(() => {
      if (!this.player) {
        return;
      }
      const loopedTime = getEffectPreviewLoopTime(this.player.currentTime);
      if (loopedTime !== this.player.currentTime) {
        this.player.seek(loopedTime);
      }
    }, 80);
  }

  private destroyPlayer(): void {
    if (!this.player) {
      return;
    }
    this.player.destroy();
    this.player = null;
    this.lastFeaturesSampleAt = 0;
    this.cachedFeatures = EMPTY_AUDIO_FEATURES;
  }
}
