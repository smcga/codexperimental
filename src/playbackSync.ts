export type PlaybackSyncAction = "start" | "restart" | "play" | "pause" | "seek";

export type PlaybackSyncMessage =
  | {
      type: "transport";
      sourceId: string;
      action: PlaybackSyncAction;
      time?: number;
    }
  | {
      type: "state";
      sourceId: string;
      playing: boolean;
      time: number;
    };

export interface PlaybackSyncCallbacks {
  onRemoteTransport: (action: PlaybackSyncAction, time?: number) => void;
  onRemoteState: (state: { playing: boolean; time: number }) => void;
}

export interface PlaybackSyncController {
  broadcastTransport: (action: PlaybackSyncAction, time?: number) => void;
  broadcastState: (state: { playing: boolean; time: number }) => void;
  destroy: () => void;
}

export function shouldApplyRemotePlayingState(
  localPlaying: boolean,
  remotePlaying: boolean,
  allowStateDrivenTransport = false
): boolean {
  return allowStateDrivenTransport && localPlaying !== remotePlaying;
}

export function shouldApplyRemoteState(localTime: number, remoteTime: number, thresholdSeconds = 0.2): boolean {
  if (!Number.isFinite(localTime) || !Number.isFinite(remoteTime) || !Number.isFinite(thresholdSeconds) || thresholdSeconds < 0) {
    return false;
  }
  return Math.abs(localTime - remoteTime) > thresholdSeconds;
}

function supportsBroadcastChannel(): boolean {
  return typeof BroadcastChannel !== "undefined";
}

function isPlaybackSyncMessage(value: unknown): value is PlaybackSyncMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<PlaybackSyncMessage>;
  return (
    record.type === "transport" ||
    (record.type === "state" && typeof record.playing === "boolean" && typeof record.time === "number")
  );
}

export function createPlaybackSyncController(
  callbacks: PlaybackSyncCallbacks,
  options?: { channelName?: string; sourceId?: string }
): PlaybackSyncController {
  const sourceId = options?.sourceId ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const channelName = options?.channelName ?? "codexperimental.playback-sync";
  const channel = supportsBroadcastChannel() ? new BroadcastChannel(channelName) : null;

  const post = (message: PlaybackSyncMessage): void => {
    channel?.postMessage(message);
  };

  channel?.addEventListener("message", (event: MessageEvent<unknown>) => {
    if (!isPlaybackSyncMessage(event.data) || event.data.sourceId === sourceId) {
      return;
    }
    if (event.data.type === "transport") {
      callbacks.onRemoteTransport(event.data.action, event.data.time);
      return;
    }
    callbacks.onRemoteState({ playing: event.data.playing, time: event.data.time });
  });

  return {
    broadcastTransport: (action, time) => {
      post({ type: "transport", action, sourceId, time });
    },
    broadcastState: (state) => {
      post({ type: "state", sourceId, playing: state.playing, time: state.time });
    },
    destroy: () => {
      channel?.close();
    }
  };
}
