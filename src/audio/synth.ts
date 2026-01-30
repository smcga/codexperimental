import { noteToFrequency } from "../util/math";

export type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export const applyEnvelope = (gain: GainNode, time: number, duration: number, env: Envelope) => {
  const sustainTime = Math.max(0, duration - env.attack - env.decay);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(1, time + env.attack);
  gain.gain.exponentialRampToValueAtTime(env.sustain, time + env.attack + env.decay);
  gain.gain.setValueAtTime(env.sustain, time + env.attack + env.decay + sustainTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration + env.release);
};

export const playLead = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  midi: number,
  duration: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = noteToFrequency(midi);
  lfo.frequency.value = 5.5;
  lfoGain.gain.value = 9;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  applyEnvelope(gain, time, duration, { attack: 0.01, decay: 0.08, sustain: 0.4, release: 0.08 });
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  lfo.start(time);
  osc.stop(time + duration + 0.2);
  lfo.stop(time + duration + 0.2);
};

export const playBass = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  midi: number,
  duration: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = noteToFrequency(midi);
  applyEnvelope(gain, time, duration, { attack: 0.005, decay: 0.08, sustain: 0.3, release: 0.08 });
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + duration + 0.2);
};

export const playArp = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  midi: number,
  duration: number
) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = noteToFrequency(midi);
  applyEnvelope(gain, time, duration, { attack: 0.005, decay: 0.05, sustain: 0.2, release: 0.05 });
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + duration + 0.1);
};

export const createNoiseBuffer = (ctx: AudioContext) => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export const playKick = (ctx: AudioContext, destination: AudioNode, time: number) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(120, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(1, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.2);
};

export const playSnare = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  noise: AudioBuffer
) => {
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noise;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1800;
  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);
  noiseSource.start(time);
  noiseSource.stop(time + 0.2);
};

export const playHat = (
  ctx: AudioContext,
  destination: AudioNode,
  time: number,
  noise: AudioBuffer
) => {
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noise;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, time);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 5000;
  noiseSource.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);
  noiseSource.start(time);
  noiseSource.stop(time + 0.08);
};
