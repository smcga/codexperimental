export type AudioFeatures = {
  timeDomain: Uint8Array;
  frequency: Uint8Array;
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  beat: boolean;
  beatStrength: number;
  impactStrength: number;
};

export interface AudioSource {
  start(): Promise<void>;
  stop?: () => void;
  getTimeSeconds(): number;
  getFeatures(): AudioFeatures;
}
