export interface TransportOptions {
  bpm: number;
  scheduleAheadTime?: number;
  lookaheadMs?: number;
}

export type SchedulerCallback = (beat: number, time: number) => void;

export class Transport {
  private bpm: number;
  private scheduleAheadTime: number;
  private lookaheadMs: number;
  private nextBeat: number;
  private timerId: number | null = null;
  private callback: SchedulerCallback;
  private startTime = 0;

  constructor(options: TransportOptions, callback: SchedulerCallback) {
    this.bpm = options.bpm;
    this.scheduleAheadTime = options.scheduleAheadTime ?? 0.12;
    this.lookaheadMs = options.lookaheadMs ?? 25;
    this.callback = callback;
    this.nextBeat = 0;
  }

  start(context: AudioContext) {
    this.startTime = context.currentTime + 0.05;
    this.nextBeat = 0;
    this.timerId = window.setInterval(() => {
      const currentBeat = this.getBeatAtTime(context.currentTime);
      while (this.nextBeat < currentBeat + this.scheduleAheadTime * (this.bpm / 60)) {
        const time = this.getTimeAtBeat(this.nextBeat);
        this.callback(this.nextBeat, time);
        this.nextBeat += 0.25; // 16th note
      }
    }, this.lookaheadMs);
    return this.startTime;
  }

  stop() {
    if (this.timerId) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  getTimeAtBeat(beat: number) {
    return this.startTime + (beat * 60) / this.bpm;
  }

  getBeatAtTime(time: number) {
    return (time - this.startTime) * (this.bpm / 60);
  }
}
