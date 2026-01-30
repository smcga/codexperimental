import { Transport } from "./transport";
import { noteToFreq, playHat, playKick, playNote, playSnare } from "./synth";
import { dropTime } from "../timeline";

export interface SongTriggers {
  kickTimes: number[];
  snareTimes: number[];
}

const bpm = 160;

const scale = [0, 3, 5, 7, 10];

const bassPattern = [0, 0, 7, 0, 5, 0, 7, 3];
const leadPattern = [0, 3, 5, 7, 10, 7, 5, 3];

const introArp = [0, 3, 7, 10];
const buildArp = [0, 5, 7, 12];

const kickPatternIntro = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const kickPatternDrop = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];
const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const hatPattern = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

export const createSong = (context: AudioContext, master: GainNode, triggers: SongTriggers) => {
  const transport = new Transport({ bpm }, (beat, time) => {
    const step = Math.floor(beat * 4) % 16;
    const bar = Math.floor(beat / 4);
    const dropBeat = dropTime * (bpm / 60);
    const buildStart = Math.max(0, dropBeat - 32);
    const isDrop = beat >= dropBeat;
    const isBuild = beat >= buildStart && beat < dropBeat;

    const rootNote = 45 + scale[bar % scale.length];

    if (step % 8 === 0) {
      const bassNote = rootNote + bassPattern[bar % bassPattern.length];
      playNote(context, master, time, noteToFreq(bassNote), 0.3, "triangle", {
        attack: 0.01,
        decay: 0.08,
        sustain: isDrop ? 0.6 : 0.4,
        release: 0.1
      }, isDrop ? 0.45 : 0.3);
    }

    if (step % 4 === 0 && (isBuild || isDrop)) {
      const leadNote = 60 + leadPattern[(bar + step) % leadPattern.length];
      playNote(context, master, time, noteToFreq(leadNote), 0.25, "square", {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.5,
        release: 0.1
      }, isDrop ? 0.25 : 0.18);
    }

    const arpPattern = isDrop ? buildArp : introArp;
    if (step % 2 === 0) {
      const arpNote = 72 + arpPattern[(step / 2) % arpPattern.length];
      playNote(context, master, time, noteToFreq(arpNote), 0.12, "square", {
        attack: 0.01,
        decay: 0.03,
        sustain: 0.4,
        release: 0.05
      }, isDrop ? 0.12 : 0.08);
    }

    const kickPattern = isDrop ? kickPatternDrop : kickPatternIntro;
    if (kickPattern[step]) {
      playKick(context, master, time, isDrop ? 0.9 : 0.6);
      triggers.kickTimes.push(time);
    }
    if (snarePattern[step] && (isBuild || isDrop)) {
      playSnare(context, master, time, isDrop ? 0.45 : 0.3);
      triggers.snareTimes.push(time);
    }
    if (hatPattern[step] && (isBuild || isDrop)) {
      playHat(context, master, time, isDrop ? 0.25 : 0.18);
    }
  });

  return { transport, bpm };
};
