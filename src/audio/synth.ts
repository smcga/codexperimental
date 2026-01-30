export interface Envelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export const noteToFreq = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

export const playNote = (
  context: AudioContext,
  destination: AudioNode,
  time: number,
  frequency: number,
  duration: number,
  type: OscillatorType,
  envelope: Envelope,
  gain = 0.3
) => {
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, time);

  amp.gain.setValueAtTime(0, time);
  amp.gain.linearRampToValueAtTime(gain, time + envelope.attack);
  amp.gain.linearRampToValueAtTime(
    gain * envelope.sustain,
    time + envelope.attack + envelope.decay
  );
  amp.gain.setValueAtTime(
    gain * envelope.sustain,
    time + Math.max(envelope.attack + envelope.decay, duration - envelope.release)
  );
  amp.gain.linearRampToValueAtTime(0, time + duration);

  osc.connect(amp);
  amp.connect(destination);
  osc.start(time);
  osc.stop(time + duration + 0.05);
};

let noiseBuffer: AudioBuffer | null = null;

export const getNoiseBuffer = (context: AudioContext) => {
  if (noiseBuffer) {
    return noiseBuffer;
  }
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
};

export const playKick = (
  context: AudioContext,
  destination: AudioNode,
  time: number,
  gain = 0.8
) => {
  const osc = context.createOscillator();
  const amp = context.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(50, time + 0.25);
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
  osc.connect(amp);
  amp.connect(destination);
  osc.start(time);
  osc.stop(time + 0.4);
};

export const playSnare = (
  context: AudioContext,
  destination: AudioNode,
  time: number,
  gain = 0.5
) => {
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 1000;
  const amp = context.createGain();
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
  noise.connect(filter);
  filter.connect(amp);
  amp.connect(destination);
  noise.start(time);
  noise.stop(time + 0.25);
};

export const playHat = (
  context: AudioContext,
  destination: AudioNode,
  time: number,
  gain = 0.25
) => {
  const noise = context.createBufferSource();
  noise.buffer = getNoiseBuffer(context);
  const filter = context.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 4000;
  const amp = context.createGain();
  amp.gain.setValueAtTime(gain, time);
  amp.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
  noise.connect(filter);
  filter.connect(amp);
  amp.connect(destination);
  noise.start(time);
  noise.stop(time + 0.1);
};
