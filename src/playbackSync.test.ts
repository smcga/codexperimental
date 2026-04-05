import { describe, expect, it, vi } from "vitest";
import { createPlaybackSyncController, shouldApplyRemoteState } from "./playbackSync";

class BroadcastChannelMock {
  static channels = new Map<string, Set<BroadcastChannelMock>>();

  private listeners = new Set<(event: MessageEvent<unknown>) => void>();

  constructor(private readonly name: string) {
    const set = BroadcastChannelMock.channels.get(name) ?? new Set<BroadcastChannelMock>();
    set.add(this);
    BroadcastChannelMock.channels.set(name, set);
  }

  postMessage(data: unknown): void {
    const peers = BroadcastChannelMock.channels.get(this.name);
    if (!peers) {
      return;
    }
    peers.forEach((peer) => {
      if (peer === this) {
        return;
      }
      peer.listeners.forEach((listener) => listener({ data } as MessageEvent<unknown>));
    });
  }

  addEventListener(_event: "message", listener: (event: MessageEvent<unknown>) => void): void {
    this.listeners.add(listener);
  }

  close(): void {
    BroadcastChannelMock.channels.get(this.name)?.delete(this);
  }
}

describe("shouldApplyRemoteState", () => {
  it("returns true when the remote state differs by more than the threshold", () => {
    expect(shouldApplyRemoteState(10, 10.4, 0.2)).toBe(true);
  });

  it("returns false when the drift is within the threshold", () => {
    expect(shouldApplyRemoteState(10, 10.1, 0.2)).toBe(false);
  });
});

describe("createPlaybackSyncController", () => {
  it("forwards transport and state messages across windows", () => {
    const previous = globalThis.BroadcastChannel;
    vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);

    const onRemoteTransport = vi.fn();
    const onRemoteState = vi.fn();

    const host = createPlaybackSyncController(
      {
        onRemoteTransport: vi.fn(),
        onRemoteState: vi.fn()
      },
      { channelName: "test-channel", sourceId: "host" }
    );
    const follower = createPlaybackSyncController(
      {
        onRemoteTransport,
        onRemoteState
      },
      { channelName: "test-channel", sourceId: "follower" }
    );

    host.broadcastTransport("seek", 42);
    host.broadcastState({ playing: true, time: 42 });

    expect(onRemoteTransport).toHaveBeenCalledWith("seek", 42);
    expect(onRemoteState).toHaveBeenCalledWith({ playing: true, time: 42 });

    host.destroy();
    follower.destroy();
    if (previous) {
      vi.stubGlobal("BroadcastChannel", previous);
    } else {
      vi.unstubAllGlobals();
    }
  });
});
