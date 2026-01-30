import { dropTime, getSection } from '../timeline';
import {
  defaultEnvelope,
  noteToFrequency,
  playKick,
  playNoise,
  playOscillator
} from './synth';

export type DrumType = 'kick' | 'snare' | 'hat';

export interface SongEvents {
  onDrum?: (type: DrumType, time: number) => void;
}

const leadNotes = [72, 76, 79, 83, 79, 76, 74, 71];
const arpNotes = [60, 64, 67, 72, 67, 64, 60, 64];
const bassNotes = [36, 36, 39, 41, 36, 36, 39, 34];

const introKick = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const buildKick = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
const dropKick = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const snarePattern = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const hatPattern = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];

export const scheduleSongStep = (
  context: AudioContext,
  step: number,
  time: number,
  startTime: number,
  events: SongEvents
) => {
  const demoTime = time - startTime;
  const section = getSection(demoTime);
  const localStep = step % 16;

  const kickPattern = section === 'drop' ? dropKick : section === 'build' ? buildKick : introKick;

  if (kickPattern[localStep]) {
    playKick(context, time, section === 'drop' ? 0.8 : 0.6);
    events.onDrum?.('kick', time);
  }

  if (snarePattern[localStep] && section !== 'intro') {
    playNoise(context, time, 0.12, section === 'drop' ? 0.4 : 0.25, 900);
    events.onDrum?.('snare', time);
  }

  if (hatPattern[localStep]) {
    playNoise(context, time, 0.05, section === 'drop' ? 0.2 : 0.12, 2500);
    events.onDrum?.('hat', time);
  }

  if (localStep % 4 === 0) {
    const bassIndex = (step / 4) % bassNotes.length;
    playOscillator(
      context,
      time,
      0.4,
      noteToFrequency(bassNotes[bassIndex]),
      section === 'drop' ? 'square' : 'triangle',
      { ...defaultEnvelope, attack: 0.01, decay: 0.05, sustain: 0.4, release: 0.2 },
      section === 'drop' ? 0.35 : 0.22
    );
  }

  if (section !== 'intro' && localStep % 2 === 0) {
    const arpIndex = step % arpNotes.length;
    playOscillator(
      context,
      time,
      0.18,
      noteToFrequency(arpNotes[arpIndex]),
      'square',
      { ...defaultEnvelope, attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 },
      section === 'drop' ? 0.18 : 0.12
    );
  }

  if (section !== 'intro' && localStep === 0) {
    const leadIndex = (step / 4) % leadNotes.length;
    playOscillator(
      context,
      time,
      0.6,
      noteToFrequency(leadNotes[leadIndex]),
      'square',
      { ...defaultEnvelope, attack: 0.02, decay: 0.1, sustain: 0.6, release: 0.2 },
      section === 'drop' ? 0.2 : 0.12,
      { rate: 6, depth: 6 }
    );
  }

  if (demoTime >= dropTime && section === 'drop' && localStep === 0) {
    playOscillator(
      context,
      time,
      0.3,
      noteToFrequency(84),
      'square',
      { ...defaultEnvelope, attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.1 },
      0.15
    );
  }
};
