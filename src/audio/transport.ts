export type StepCallback = (step: number, time: number, beat: number) => void;

export class Transport {
  private ctx: AudioContext;
  private bpm: number;
  private stepDuration: number;
  private lookahead = 0.025;
  private scheduleAhead = 0.2;
  private intervalId: number | null = null;
  private currentStep = 0;
  private nextStepTime = 0;
  private startTime = 0;

  constructor(ctx: AudioContext, bpm: number) {
    this.ctx = ctx;
    this.bpm = bpm;
    this.stepDuration = (60 / bpm) / 4;
  }

  start(startTime: number, callback: StepCallback) {
    this.startTime = startTime;
    this.currentStep = 0;
    this.nextStepTime = startTime;
    this.intervalId = window.setInterval(() => {
      while (this.nextStepTime < this.ctx.currentTime + this.scheduleAhead) {
        const beat = this.currentStep / 4;
        callback(this.currentStep, this.nextStepTime, beat);
        this.currentStep += 1;
        this.nextStepTime += this.stepDuration;
      }
    }, this.lookahead * 1000);
  }

  stop() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getStartTime() {
    return this.startTime;
  }

  getBpm() {
    return this.bpm;
  }
}
