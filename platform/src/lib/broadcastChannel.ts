/**
 * Broadcast sync via Supabase Postgres Changes.
 *
 * The broadcast_room DB row IS the state. Host writes to it; viewer subscribes
 * to row-level changes via Postgres CDC (WAL). Late joiners just read the row.
 * No fire-and-forget Broadcast messages for state — only for high-frequency
 * playback ticks that don't need persistence.
 */

import { supabase } from "../supabaseClient";

export type RoomRow = {
  id: string;
  host_user_id: string;
  title: string;
  current_preset_data: object | null;
  current_audio_url: string | null;
  is_playing: boolean;
  current_time: number;
  is_active: boolean;
};

export type PlaybackTick = {
  type: "tick";
  currentTime: number;
  playing: boolean;
};

export type CloseFn = () => void;

const channelName = (roomId: string) => `broadcast-ticks-${roomId}`;

/**
 * Host: write state changes to DB. Viewers react via Postgres Changes.
 */
export async function pushRoomState(
  roomId: string,
  patch: Partial<Omit<RoomRow, "id" | "host_user_id">>
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("broadcast_room")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", roomId);
}

/**
 * Host: send high-frequency playback tick via Broadcast (no persistence needed,
 * just drift correction while viewer is connected).
 */
export function openHostTicker(roomId: string): {
  tick: (t: PlaybackTick) => void;
  close: CloseFn;
} {
  if (!supabase) return { tick: () => {}, close: () => {} };
  const channel = supabase.channel(channelName(roomId));
  let ready = false;
  channel.subscribe((status) => { if (status === "SUBSCRIBED") ready = true; });

  return {
    tick: (t) => {
      if (!ready) return;
      channel.send({ type: "broadcast", event: "tick", payload: t });
    },
    close: () => supabase!.removeChannel(channel),
  };
}

/**
 * Viewer: subscribe to Postgres Changes on the room row + Broadcast ticks.
 * Returns the current row and a close function.
 */
export function openViewerSubscription(
  roomId: string,
  onRowChange: (row: Partial<RoomRow>) => void,
  onTick: (t: PlaybackTick) => void
): CloseFn {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`viewer-${roomId}`)
    // Row-level CDC — fires whenever host writes to broadcast_room
    .on(
      "postgres_changes" as any,
      {
        event: "UPDATE",
        schema: "public",
        table: "broadcast_room",
        filter: `id=eq.${roomId}`,
      },
      (payload: any) => onRowChange(payload.new as Partial<RoomRow>)
    )
    // High-frequency playback ticks (drift correction)
    .on("broadcast", { event: "tick" }, ({ payload }) =>
      onTick(payload as PlaybackTick)
    );

  channel.subscribe();
  return () => supabase!.removeChannel(channel);
}
