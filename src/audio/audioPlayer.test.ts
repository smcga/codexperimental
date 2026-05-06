import { beforeEach, describe, expect, it, vi } from "vitest";

import { AudioPlayer } from "./audioPlayer";

class FakeBufferSource {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  loop = false;
  start = vi.fn();
  stop = vi.fn(() => this.onended?.());
  connect = vi.fn();
  disconnect = vi.fn();
}

describe("AudioPlayer (Web Audio clock)", () => {
  const fakeAnalyser = {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    getByteTimeDomainData: vi.fn((arr: Uint8Array) => arr.fill(128)),
    getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(0))
  };
  const fakeGain = { gain: { value: 1 }, connect: vi.fn() };
  const fakeBuffer = { duration: 12.5 } as AudioBuffer;
  let sources: FakeBufferSource[] = [];
  let mockContext: any;

  beforeEach(() => {
    sources = [];
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
    vi.spyOn(performance, "now").mockReturnValue(1_000);

    mockContext = {
      currentTime: 5,
      sampleRate: 48_000,
      destination: {},
      createAnalyser: vi.fn(() => fakeAnalyser),
      createGain: vi.fn(() => fakeGain),
      createBufferSource: vi.fn(() => {
        const source = new FakeBufferSource();
        sources.push(source);
        return source as unknown as AudioBufferSourceNode;
      }),
      resume: vi.fn(async () => {}),
      decodeAudioData: vi.fn(async () => fakeBuffer),
      close: vi.fn()
    };

    vi.stubGlobal("AudioContext", vi.fn(() => mockContext));
  });

  it("returns pausedAt when paused and seek clamps negative values", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    player.seek(-4);
    expect(player.currentTime).toBe(0);
    player.seek(3.25);
    expect(player.currentTime).toBeCloseTo(3.25, 6);
  });

  it("play() schedules source from pausedAt using context clock", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    player.seek(2.5);

    await player.play();

    expect(mockContext.resume).toHaveBeenCalled();
    expect(sources).toHaveLength(1);
    expect(sources[0].start).toHaveBeenCalledWith(5.05, 2.5);
  });

  it("currentTime uses context.currentTime fallback when output timestamp is unavailable", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    await player.play();

    mockContext.currentTime = 8;
    expect(player.currentTime).toBeCloseTo(2.95, 5);
  });

  it("currentTime prefers getOutputTimestamp when available", async () => {
    mockContext.getOutputTimestamp = vi.fn(() => ({ contextTime: 10, performanceTime: 900 }));
    vi.spyOn(performance, "now").mockReturnValue(1_000);

    const player = new AudioPlayer("/song.ogg");
    await player.load();
    await player.play();

    expect(player.currentTime).toBeCloseTo(5.05, 5);
  });

  it("seek() while playing restarts source from requested time", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    await player.play();

    player.seek(4);

    expect(sources).toHaveLength(2);
    expect(sources[0].stop).toHaveBeenCalled();
    expect(sources[1].start).toHaveBeenCalledWith(5.05, 4);
  });

  it("pause() stores current time and stops active source", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    await player.play();
    mockContext.currentTime = 9;

    player.pause();

    expect(sources[0].stop).toHaveBeenCalled();
    expect(player.paused).toBe(true);
    expect(player.currentTime).toBeCloseTo(3.95, 5);
  });

  it("keeps analyser APIs working", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    const features = player.updateFeatures();
    expect(features.timeDomain).toHaveLength(2048);
    expect(features.frequency).toHaveLength(1024);
    expect(fakeAnalyser.getByteFrequencyData).toHaveBeenCalled();
  });

  it("tries fallback file extensions when initial decode fails", async () => {
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode(url).buffer
    }));
    vi.stubGlobal("fetch", fetchMock);
    mockContext.decodeAudioData = vi.fn(async (buffer: ArrayBuffer) => {
      const marker = new TextDecoder().decode(buffer);
      if (marker.includes(".ogg")) {
        throw new Error("unsupported format");
      }
      return fakeBuffer;
    });

    const player = new AudioPlayer("/song.ogg");
    await player.load();

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/song.ogg");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/song.mp3");
    expect(player.duration).toBeCloseTo(12.5, 6);
  });

  it("applies loop preference to newly created sources", async () => {
    const player = new AudioPlayer("/song.ogg");
    await player.load();
    player.setLoop(true);

    await player.play();

    expect(sources[0].loop).toBe(true);
  });
});
