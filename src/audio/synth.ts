export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export const defaultEnvelope: Envelope = {
  attack: 0.01,
  decay: 0.08,
  sustain: 0.6,
  release: 0.2
};

export const createGainEnvelope = (
  context: AudioContext,
  time: number,
  duration: number,
  envelope: Envelope,
  maxGain: number
) => {
  const gain = context.createGain();
  const attackEnd = time + envelope.attack;
  const decayEnd = attackEnd + envelope.decay;
  const releaseStart = time + Math.max(0, duration - envelope.release);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(maxGain, attackEnd);
  gain.gain.linearRampToValueAtTime(maxGain * envelope.sustain, decayEnd);
  gain.gain.setValueAtTime(maxGain * envelope.sustain, releaseStart);
  gain.gain.linearRampToValueAtTime(0, releaseStart + envelope.release);
  return gain;
};

export const playOscillator = (
  context: AudioContext,
  time: number,
  duration: number,
  frequency: number,
  type: OscillatorType,
  envelope: Envelope,
  gainValue: number,
  vibrato?: { rate: number; depth: number }
) => {
  const oscillator = context.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);

  if (vibrato) {
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = vibrato.rate;
    lfoGain.gain.value = vibrato.depth;
    lfo.connect(lfoGain).connect(oscillator.frequency);
    lfo.start(time);
    lfo.stop(time + duration + envelope.release);
  }

  const gain = createGainEnvelope(context, time, duration, envelope, gainValue);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + duration + envelope.release + 0.02);
};

export const playKick = (context: AudioContext, time: number, gainValue: number) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(160, time);
  oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.25);
  gain.gain.setValueAtTime(gainValue, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + 0.35);
};

export const playNoise = (
  context: AudioContext,
  time: number,
  duration: number,
  gainValue: number,
  highpass = 800
) => {
  const bufferSize = context.sampleRate * duration;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  const gain = context.createGain();
  gain.gain.setValueAtTime(gainValue, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(time);
  source.stop(time + duration);
};

export const noteToFrequency = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
