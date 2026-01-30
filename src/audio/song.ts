import { BEAT_DURATION } from "./transport";
import { dropTime } from "../timeline";
import { Synth } from "./synth";

export type Section = "intro" | "build" | "drop";

const dropBeat = Math.floor(dropTime / BEAT_DURATION);
const buildBeat = Math.max(16, dropBeat - 16);

const leadNotes = [
  72, 76, 79, 83, 79, 76, 72, 69,
  72, 76, 79, 83, 86, 83, 79, 76
];

const arpNotes = [72, 76, 79, 84];
const bassNotes = [36, 36, 38, 36, 41, 41, 38, 36];

const introKick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const dropKick = [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0];
const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const hatPattern = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

export function getSection(beat: number): Section {
  if (beat < buildBeat) {
    return "intro";
  }
  if (beat < dropBeat) {
    return "build";
  }
  return "drop";
}

export function isKickStep(step: number, beat: number): boolean {
  const pattern = getSection(beat) === "drop" ? dropKick : introKick;
  return pattern[step % 16] === 1;
}

export function scheduleStep(synth: Synth, step: number, time: number): void {
  const beat = step / 4;
  const section = getSection(beat);
  const patternKick = section === "drop" ? dropKick : introKick;
  const kick = patternKick[step % 16] === 1;
  const snare = snarePattern[step % 16] === 1;
  const hat = hatPattern[step % 16] === 1;

  if (kick) {
    synth.playKick(time, section === "drop" ? 1.2 : 0.6);
  }
  if (snare) {
    synth.playSnare(time, section === "drop" ? 0.5 : 0.3);
  }
  if (hat && section !== "intro") {
    synth.playHat(time, section === "drop" ? 0.2 : 0.15);
  }

  if (step % 4 === 0) {
    const bassIndex = Math.floor((step / 4) % bassNotes.length);
    const bassNote = bassNotes[bassIndex];
    const bassGain = section === "drop" ? 0.5 : 0.3;
    synth.playTone("triangle", midiToFreq(bassNote), time, BEAT_DURATION * 0.9, bassEnv, bassGain);
  }

  if (section !== "intro" || step % 8 === 0) {
    const leadIndex = step % leadNotes.length;
    const leadNote = leadNotes[leadIndex];
    const leadGain = section === "drop" ? 0.24 : 0.18;
    synth.playTone("square", midiToFreq(leadNote), time, BEAT_DURATION * 0.45, leadEnv, leadGain, 5);
  }

  if (section === "drop" || section === "build") {
    const arpIndex = step % arpNotes.length;
    const arpNote = arpNotes[arpIndex] + (section === "drop" ? 12 : 0);
    synth.playTone("square", midiToFreq(arpNote), time, BEAT_DURATION * 0.25, arpEnv, 0.12);
  }
}

const leadEnv = { attack: 0.01, decay: 0.05, sustain: 0.7, release: 0.2 };
const bassEnv = { attack: 0.01, decay: 0.08, sustain: 0.6, release: 0.2 };
const arpEnv = { attack: 0.005, decay: 0.03, sustain: 0.5, release: 0.08 };

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}
