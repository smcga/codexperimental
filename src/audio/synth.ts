export type Envelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};

export class Synth {
  private noiseBuffer: AudioBuffer;

  constructor(private audioContext: AudioContext) {
    this.noiseBuffer = this.createNoiseBuffer();
  }

  playTone(
    type: OscillatorType,
    frequency: number,
    time: number,
    duration: number,
    envelope: Envelope,
    gainValue: number,
    vibrato = 0
  ): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);

    if (vibrato > 0) {
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = vibrato;
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(time);
      lfo.stop(time + duration + envelope.release);
    }

    this.applyEnvelope(gain, time, duration, envelope, gainValue);
    osc.connect(gain).connect(this.audioContext.destination);
    osc.start(time);
    osc.stop(time + duration + envelope.release + 0.05);
  }

  playKick(time: number, gainValue: number): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain).connect(this.audioContext.destination);
    osc.start(time);
    osc.stop(time + 0.21);
  }

  playSnare(time: number, gainValue: number): void {
    const noise = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    noise.buffer = this.noiseBuffer;
    filter.type = "highpass";
    filter.frequency.value = 800;
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    noise.connect(filter).connect(gain).connect(this.audioContext.destination);
    noise.start(time);
    noise.stop(time + 0.13);
  }

  playHat(time: number, gainValue: number): void {
    const noise = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();
    noise.buffer = this.noiseBuffer;
    gain.gain.setValueAtTime(gainValue, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(gain).connect(this.audioContext.destination);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  private applyEnvelope(
    gain: GainNode,
    time: number,
    duration: number,
    envelope: Envelope,
    maxGain: number
  ): void {
    const { attack, decay, sustain, release } = envelope;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(maxGain, time + attack);
    gain.gain.linearRampToValueAtTime(maxGain * sustain, time + attack + decay);
    gain.gain.setValueAtTime(maxGain * sustain, time + duration);
    gain.gain.linearRampToValueAtTime(0.0001, time + duration + release);
  }

  private createNoiseBuffer(): AudioBuffer {
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
