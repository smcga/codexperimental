import { playArp, playBass, playHat, playKick, playLead, playSnare, createNoiseBuffer } from "./synth";

export type BeatEvent = {
  time: number;
  type: "kick" | "snare";
};

export class Song {
  private ctx: AudioContext;
  private master: GainNode;
  private noise: AudioBuffer;
  private dropBeat: number;
  private events: BeatEvent[] = [];

  constructor(ctx: AudioContext, dropBeat: number) {
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0.7;
    this.master.connect(ctx.destination);
    this.noise = createNoiseBuffer(ctx);
    this.dropBeat = dropBeat;
  }

  scheduleStep(step: number, time: number) {
    const beat = step / 4;
    const stepInBar = step % 16;
    const isDrop = beat >= this.dropBeat;
    const kickPattern = isDrop
      ? [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0]
      : [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0];
    const snarePattern = isDrop
      ? [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
      : [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0];
    const hatPattern = isDrop
      ? [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      : [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

    if (kickPattern[stepInBar]) {
      playKick(this.ctx, this.master, time);
      this.events.push({ time, type: "kick" });
    }
    if (snarePattern[stepInBar]) {
      playSnare(this.ctx, this.master, time, this.noise);
      this.events.push({ time, type: "snare" });
    }
    if (hatPattern[stepInBar]) {
      playHat(this.ctx, this.master, time, this.noise);
    }

    const bassNotes = isDrop
      ? [36, 36, 38, 41, 36, 36, 38, 43, 36, 36, 38, 41, 36, 36, 38, 43]
      : [36, 36, 36, 36, 36, 36, 38, 38, 36, 36, 36, 36, 34, 34, 36, 36];
    if (stepInBar % 2 === 0) {
      playBass(this.ctx, this.master, time, bassNotes[stepInBar], 0.2);
    }

    const chord = isDrop ? [60, 64, 67, 71] : [60, 63, 67, 70];
    const arpNotes = chord.map((note) => note + (isDrop ? 12 : 0));
    playArp(this.ctx, this.master, time, arpNotes[stepInBar % arpNotes.length], 0.12);

    if (stepInBar === 0 || stepInBar === 8) {
      const leadNote = isDrop ? 72 : 69;
      playLead(this.ctx, this.master, time + 0.02, leadNote + (stepInBar === 8 ? 3 : 0), 0.35);
    }
  }

  consumeEvents(currentTime: number) {
    const ready = this.events.filter((event) => event.time <= currentTime);
    this.events = this.events.filter((event) => event.time > currentTime);
    return ready;
  }
}
