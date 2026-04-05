import { AudioPlayer, AudioFeatures } from "./audio/audioPlayer";

export const EFFECT_PREVIEW_AUDIO_START_TIME = 5 * 60 + 12.85;
export const EFFECT_PREVIEW_AUDIO_LOOP_START_TIME = 5 * 60 + 39.934;
export const EFFECT_PREVIEW_AUDIO_LOOP_END_TIME = 5 * 60 + 50.786;
export const EFFECT_PREVIEW_AUDIO_VOLUME = 0.2;
const LOOP_SYNC_INTERVAL_MS = 120;

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

export function shouldRestartEffectPreviewLoop(currentTime: number, paused: boolean): boolean {
  return currentTime >= EFFECT_PREVIEW_AUDIO_LOOP_END_TIME && paused;
}

export class EffectPreviewAudioController {
  private player: AudioPlayer | null = null;
  private loopSyncTimer: ReturnType<typeof setInterval> | null = null;

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
    }

    this.player.seek(EFFECT_PREVIEW_AUDIO_START_TIME);

    try {
      await this.player.play();
    } catch {
      // Ignore autoplay rejections; preview rendering still runs with silent audio features.
    }

    this.startLoopSync();
  }

  stop(): void {
    this.player?.pause();
    this.stopLoopSync();
  }

  destroy(): void {
    this.stop();
    this.destroyPlayer();
  }

  getPlaybackTime(): number {
    if (!this.player) {
      return EFFECT_PREVIEW_AUDIO_START_TIME;
    }
    this.syncLoopWindow();
    return this.player.currentTime;
  }

  getFeatures(): AudioFeatures {
    if (!this.player) {
      return EMPTY_AUDIO_FEATURES;
    }
    this.syncLoopWindow();
    return this.player.updateFeatures();
  }

  private syncLoopWindow(): void {
    if (!this.player) {
      return;
    }
    const { currentTime, paused } = this.player;
    const loopedTime = getEffectPreviewLoopTime(currentTime);
    if (loopedTime !== currentTime) {
      this.player.seek(loopedTime);
      if (shouldRestartEffectPreviewLoop(currentTime, paused)) {
        void this.player.play().catch(() => {
          // Ignore autoplay rejections during loop restart.
        });
      }
    }
  }

  private startLoopSync(): void {
    if (this.loopSyncTimer) {
      return;
    }
    this.loopSyncTimer = setInterval(() => {
      this.syncLoopWindow();
    }, LOOP_SYNC_INTERVAL_MS);
  }

  private stopLoopSync(): void {
    if (!this.loopSyncTimer) {
      return;
    }
    clearInterval(this.loopSyncTimer);
    this.loopSyncTimer = null;
  }

  private destroyPlayer(): void {
    if (!this.player) {
      return;
    }
    this.stopLoopSync();
    this.player.destroy();
    this.player = null;
  }
}
