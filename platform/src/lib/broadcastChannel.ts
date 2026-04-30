import { supabase } from "../supabaseClient";

// ── Message types ────────────────────────────────────────────────────────────

export type PresetMessage = {
  type: "preset";
  presetData: object;
  presetId?: number;
};

export type AudioMessage = {
  type: "audio";
  audioUrl: string;
};

export type PlaybackMessage = {
  type: "playback";
  playing: boolean;
  currentTime: number;
};

export type EndMessage = {
  type: "end";
};

export type StateSyncMessage = {
  type: "state";
  presetData: object | null;
  presetId?: number | null;
  audioUrl: string | null;
  playing: boolean;
  currentTime: number;
};

export type BroadcastMessage =
  | PresetMessage
  | AudioMessage
  | PlaybackMessage
  | EndMessage
  | StateSyncMessage;

// ── Channel helpers ──────────────────────────────────────────────────────────

function channelName(roomId: string) {
  return `broadcast-room-${roomId}`;
}

export type PublishFn = (msg: BroadcastMessage) => void;
export type CloseFn = () => void;

/** Open a host-side channel. Queues messages until the WS is SUBSCRIBED. */
export function openHostChannel(roomId: string): {
  publish: PublishFn;
  close: CloseFn;
} {
  if (!supabase) throw new Error("Supabase not initialised");

  const channel = supabase.channel(channelName(roomId), {
    config: { broadcast: { self: false, ack: false } },
  });

  let ready = false;
  const queue: BroadcastMessage[] = [];

  const flush = () => {
    queue.splice(0).forEach((msg) =>
      channel.send({ type: "broadcast", event: msg.type, payload: msg })
    );
  };

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      ready = true;
      flush();
    }
  });

  const publish: PublishFn = (msg) => {
    if (ready) {
      channel.send({ type: "broadcast", event: msg.type, payload: msg });
    } else {
      queue.push(msg);
    }
  };

  const close: CloseFn = () => {
    supabase!.removeChannel(channel);
  };

  return { publish, close };
}

/** Open a viewer-side channel. Returns close. */
export function openViewerChannel(
  roomId: string,
  onMessage: (msg: BroadcastMessage) => void
): CloseFn {
  if (!supabase) throw new Error("Supabase not initialised");

  const channel = supabase
    .channel(channelName(roomId), {
      config: { broadcast: { self: false } },
    })
    .on("broadcast", { event: "preset" }, ({ payload }) => onMessage(payload as BroadcastMessage))
    .on("broadcast", { event: "audio" }, ({ payload }) => onMessage(payload as BroadcastMessage))
    .on("broadcast", { event: "playback" }, ({ payload }) => onMessage(payload as BroadcastMessage))
    .on("broadcast", { event: "end" }, ({ payload }) => onMessage(payload as BroadcastMessage))
    .on("broadcast", { event: "state" }, ({ payload }) => onMessage(payload as BroadcastMessage));

  channel.subscribe();

  return () => supabase!.removeChannel(channel);
}
