export interface TransportCallbacks {
  onStep?: (step: number, time: number) => void;
}

export class Transport {
  private context: AudioContext;
  private bpm: number;
  private lookahead = 0.12;
  private interval = 0.05;
  private timerId: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private callbacks: TransportCallbacks;
  private running = false;

  constructor(context: AudioContext, bpm: number, callbacks: TransportCallbacks) {
    this.context = context;
    this.bpm = bpm;
    this.callbacks = callbacks;
  }

  start(startTime: number) {
    this.running = true;
    this.nextStepTime = startTime;
    this.step = 0;
    this.timerId = window.setInterval(() => this.schedule(), this.interval * 1000);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.running = false;
  }

  private schedule() {
    if (!this.running) {
      return;
    }
    const stepDuration = this.getStepDuration();
    while (this.nextStepTime < this.context.currentTime + this.lookahead) {
      this.callbacks.onStep?.(this.step, this.nextStepTime);
      this.nextStepTime += stepDuration;
      this.step += 1;
    }
  }

  getStepDuration() {
    return (60 / this.bpm) / 4;
  }
}
