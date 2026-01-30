export const BPM = 160;
export const BEAT_DURATION = 60 / BPM;

export type ScheduleCallback = (step: number, time: number) => void;

export class Transport {
  private currentStep = 0;
  private nextNoteTime = 0;
  private intervalId: number | null = null;
  readonly stepsPerBeat = 4;

  constructor(
    private audioContext: AudioContext,
    public startTime: number,
    private callback: ScheduleCallback
  ) {}

  start(): void {
    this.currentStep = 0;
    this.nextNoteTime = this.startTime;
    this.intervalId = window.setInterval(() => this.scheduler(), 25);
  }

  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getBeatAtTime(time: number): number {
    return (time - this.startTime) / BEAT_DURATION;
  }

  private scheduler(): void {
    const scheduleAhead = 0.2;
    while (this.nextNoteTime < this.audioContext.currentTime + scheduleAhead) {
      this.callback(this.currentStep, this.nextNoteTime);
      const secondsPerStep = BEAT_DURATION / this.stepsPerBeat;
      this.nextNoteTime += secondsPerStep;
      this.currentStep += 1;
    }
  }
}
