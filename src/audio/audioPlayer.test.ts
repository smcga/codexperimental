import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioPlayer } from "./audioPlayer";

class MockNode {
  connections: unknown[] = [];
  connect = vi.fn((target: unknown) => {
    this.connections.push(target);
    return target;
  });
  disconnect = vi.fn(() => {
    this.connections = [];
  });
}

describe("AudioPlayer", () => {
  let createBufferSource: ReturnType<typeof vi.fn>;
  let analyser: any;
  let gain: any;
  let destination: any;
  let context: any;
  let sourceA: any;
  let sourceB: any;

  beforeEach(() => {
    destination = new MockNode();
    analyser = new MockNode();
    analyser.fftSize = 0;
    analyser.frequencyBinCount = 1024;
    analyser.getByteFrequencyData = vi.fn();
    analyser.getByteTimeDomainData = vi.fn();
    gain = new MockNode();
    gain.gain = { value: 1 };

    sourceA = new MockNode();
    sourceA.start = vi.fn();
    sourceA.stop = vi.fn();
    sourceA.buffer = null;
    sourceA.loop = false;
    sourceA.onended = null;

    sourceB = new MockNode();
    sourceB.start = vi.fn();
    sourceB.stop = vi.fn();
    sourceB.buffer = null;
    sourceB.loop = false;
    sourceB.onended = null;

    createBufferSource = vi.fn().mockReturnValueOnce(sourceA).mockReturnValueOnce(sourceB);

    context = {
      currentTime: 20,
      sampleRate: 48000,
      destination,
      createAnalyser: vi.fn(() => analyser),
      createGain: vi.fn(() => gain),
      createBufferSource,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      decodeAudioData: vi.fn().mockResolvedValue({ duration: 120 }),
      getOutputTimestamp: vi.fn(() => ({ contextTime: 21, performanceTime: 1000 }))
    };

    vi.stubGlobal("AudioContext", vi.fn(() => context));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)) }));
    vi.spyOn(performance, "now").mockReturnValue(1100);
  });

  it("creates source, assigns buffer, connects graph, resumes context, and starts with offset", async () => {
    const player = new AudioPlayer("/song.mp3");
    await player.load();
    player.seek(5);
    await player.play();

    expect(context.resume).toHaveBeenCalled();
    expect(createBufferSource).toHaveBeenCalledTimes(1);
    expect(sourceA.buffer).toEqual({ duration: 120 });
    expect(sourceA.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(analyser);
    expect(analyser.connect).toHaveBeenCalledWith(destination);
    expect(sourceA.start).toHaveBeenCalledWith(20.03, 5);
  });

  it("pause stops source without disconnecting analyser to destination", async () => {
    const player = new AudioPlayer("/song.mp3");
    await player.load();
    await player.play();
    player.pause();

    expect(sourceA.stop).toHaveBeenCalledTimes(1);
    expect(sourceA.disconnect).toHaveBeenCalledTimes(1);
    expect(analyser.disconnect).not.toHaveBeenCalled();
    expect(player.paused).toBe(true);
  });

  it("seek while playing restarts source from requested time", async () => {
    const player = new AudioPlayer("/song.mp3");
    await player.load();
    await player.play();
    player.seek(42);

    expect(sourceA.stop).toHaveBeenCalledTimes(1);
    expect(createBufferSource).toHaveBeenCalledTimes(2);
    expect(sourceB.start).toHaveBeenCalledWith(20.03, 42);
  });

  it("currentTime uses output timestamp when playing and pausedAt when paused", async () => {
    const player = new AudioPlayer("/song.mp3");
    await player.load();
    player.seek(4);
    expect(player.currentTime).toBe(4);

    await player.play();
    expect(player.currentTime).toBeCloseTo(5.07, 3);
  });

  it("updateFeatures reads analyser frequency/time-domain data", async () => {
    const player = new AudioPlayer("/song.mp3");
    await player.load();
    player.updateFeatures();

    expect(analyser.getByteFrequencyData).toHaveBeenCalledTimes(1);
    expect(analyser.getByteTimeDomainData).toHaveBeenCalledTimes(1);
  });
});
