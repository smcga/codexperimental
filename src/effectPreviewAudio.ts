import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";

export const EFFECT_PREVIEW_AUDIO_SRC = "/songloop.ogg";
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

export class EffectPreviewAudioController {
  private player: AudioPlayer | null = null;
  private syntheticTimelineTime = 0;
  private timelineLastTickMs = 0;
  private timelineRunning = false;

  constructor(private src: string) {}

  setSource(src: string): void {
    if (src === this.src) {
      return;
    }
    this.src = src;
    this.destroyPlayer();
  }

  async start(): Promise<void> {
    if (!this.player) {
      this.player = new AudioPlayer(this.src);
      await this.player.load();
      this.player.setVolume(EFFECT_PREVIEW_AUDIO_VOLUME);
      this.player.setLoop(true);
    }

    this.syntheticTimelineTime = 0;
    this.timelineLastTickMs = performance.now();
    this.timelineRunning = true;
    this.player.seek(0);

    try {
      await this.player.play();
    } catch {
      // Ignore autoplay rejections; preview rendering still runs with silent audio features.
    }
  }

  stop(): void {
    this.player?.pause();
    this.updateSyntheticTimelineTime();
    this.timelineRunning = false;
  }

  destroy(): void {
    this.stop();
    this.destroyPlayer();
  }

  getPlaybackTime(): number {
    this.updateSyntheticTimelineTime();
    return this.syntheticTimelineTime;
  }

  getFeatures(): AudioFeatures {
    if (!this.player) {
      return EMPTY_AUDIO_FEATURES;
    }
    return this.player.updateFeatures();
  }

  private updateSyntheticTimelineTime(): void {
    if (!this.timelineRunning) {
      return;
    }
    const now = performance.now();
    if (this.timelineLastTickMs <= 0) {
      this.timelineLastTickMs = now;
      return;
    }
    const elapsedSeconds = Math.max(0, (now - this.timelineLastTickMs) / 1000);
    this.syntheticTimelineTime += elapsedSeconds;
    this.timelineLastTickMs = now;
  }

  private destroyPlayer(): void {
    if (!this.player) {
      return;
    }
    this.player.destroy();
    this.player = null;
  }
}
