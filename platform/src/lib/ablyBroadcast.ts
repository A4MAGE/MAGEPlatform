/**
 * Broadcast sync via Ably.
 *
 * Host publishes full state every 2s + on every change.
 * Viewers subscribe with rewind:1 — they get the last message
 * immediately on join, no race condition, no polling.
 */

import Ably from "ably";

let client: Ably.Realtime | null = null;

function getClient(): Ably.Realtime {
  if (!client) {
    const key = import.meta.env.VITE_ABLY_KEY;
    if (!key) throw new Error("VITE_ABLY_KEY not set in .env");
    client = new Ably.Realtime({ key, autoConnect: true });
  }
  return client;
}

export type RoomState = {
  presetData: object | null;
  audioUrl: string | null;
  playing: boolean;
  playbackTime: number;
  ended?: boolean;
};

export type CloseFn = () => void;

const channelName = (roomId: string) => `broadcast:${roomId}`;

/** Host: publish state. Call this on every change and on a 2s interval. */
export function publishState(roomId: string, state: RoomState): void {
  // No rewind param on publish side — rewind is subscriber-only
  const ch = getClient().channels.get(channelName(roomId));
  ch.publish("state", state);
}

/**
 * Viewer: subscribe to the channel.
 * rewind:1 replays the last message immediately on attach —
 * late joiners get current state within milliseconds.
 */
export function subscribeToRoom(
  roomId: string,
  onState: (state: RoomState) => void
): CloseFn {
  const ch = getClient().channels.get(channelName(roomId), {
    params: { rewind: "1" },
  });
  ch.subscribe("state", (msg) => onState(msg.data as RoomState));
  return () => {
    ch.unsubscribe();
    ch.detach();
  };
}
