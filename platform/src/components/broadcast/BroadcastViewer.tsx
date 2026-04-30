import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EnginePlayer from "../mage engine/EnginePlayer";
import { openViewerChannel, type BroadcastMessage, type CloseFn } from "../../lib/broadcastChannel";
import type { MAGEEngineAPI } from "@notrac/mage";

type RoomState = {
  title: string;
  current_preset_data: object | null;
  current_audio_url: string | null;
  is_active: boolean;
};

const DRIFT_THRESHOLD = 0.2;

const BroadcastViewer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [ended, setEnded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentPreset, setCurrentPreset] = useState<object | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const closeChannelRef = useRef<CloseFn | null>(null);
  const pendingPlayRef = useRef<{ play: boolean; time: number } | null>(null);
  const pendingPlayIntervalRef = useRef<number | null>(null);
  const currentPresetRef = useRef<object | null>(null);

  // Keep ref in sync so the poll fallback can check without stale closure
  useEffect(() => { currentPresetRef.current = currentPreset; }, [currentPreset]);

  // Fetch initial room state from DB
  useEffect(() => {
    if (!supabase || !roomId) return;
    supabase
      .from("broadcast_room")
      .select("title, current_preset_data, current_audio_url, is_active")
      .eq("id", roomId)
      .single()
      .then(({ data, error }: { data: any; error: any }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        if (!data.is_active) { setEnded(true); setLoading(false); return; }
        setRoom(data);
        if (data.current_preset_data) setCurrentPreset(data.current_preset_data);
        if (data.current_audio_url) setCurrentAudio(data.current_audio_url);
        setLoading(false);
      });
  }, [roomId]);

  // Poll DB every 3s as fallback while viewer has no preset yet
  useEffect(() => {
    if (!supabase || !roomId || loading || ended || notFound) return;
    const id = window.setInterval(async () => {
      if (currentPresetRef.current) { window.clearInterval(id); return; }
      const { data } = await supabase!
        .from("broadcast_room")
        .select("current_preset_data, current_audio_url, is_active")
        .eq("id", roomId)
        .single();
      if (!data) return;
      if (!data.is_active) { setEnded(true); window.clearInterval(id); return; }
      if (data.current_preset_data) setCurrentPreset(data.current_preset_data);
      if (data.current_audio_url) setCurrentAudio(data.current_audio_url);
    }, 3000);
    return () => window.clearInterval(id);
  }, [roomId, loading, ended, notFound]);

  // Subscribe to realtime channel
  useEffect(() => {
    if (!roomId || loading || ended || notFound) return;

    const handleMessage = (msg: BroadcastMessage) => {
      if (msg.type === "state") {
        if (msg.presetData) setCurrentPreset(msg.presetData);
        if (msg.audioUrl) setCurrentAudio(msg.audioUrl);
        const eng = engineRef.current;
        if (msg.playing) {
          if (eng?.isAudioLoaded()) {
            if (Math.abs((eng.getAudioTime()) - msg.currentTime) > DRIFT_THRESHOLD) eng.seek(msg.currentTime);
            eng.play();
          } else {
            // Audio not loaded yet — queue play so it fires once audio is ready
            pendingPlayRef.current = { play: true, time: msg.currentTime };
            if (!pendingPlayIntervalRef.current) {
              pendingPlayIntervalRef.current = window.setInterval(() => {
                const e = engineRef.current;
                const pending = pendingPlayRef.current;
                if (!e || !pending) { window.clearInterval(pendingPlayIntervalRef.current!); pendingPlayIntervalRef.current = null; return; }
                if (e.isAudioLoaded()) {
                  if (Math.abs(e.getAudioTime() - pending.time) > DRIFT_THRESHOLD) e.seek(pending.time);
                  e.play();
                  pendingPlayRef.current = null;
                  window.clearInterval(pendingPlayIntervalRef.current!);
                  pendingPlayIntervalRef.current = null;
                }
              }, 100);
            }
          }
        }
        return;
      }
      if (msg.type === "preset") {
        setCurrentPreset(msg.presetData);
      } else if (msg.type === "audio") {
        setCurrentAudio(msg.audioUrl);
      } else if (msg.type === "playback") {
        const eng = engineRef.current;
        if (!eng) return;
        if (msg.playing) {
          if (eng.isAudioLoaded()) {
            const localTime = eng.getAudioTime();
            if (Math.abs(localTime - msg.currentTime) > DRIFT_THRESHOLD) eng.seek(msg.currentTime);
            eng.play();
          } else {
            pendingPlayRef.current = { play: true, time: msg.currentTime };
            if (!pendingPlayIntervalRef.current) {
              pendingPlayIntervalRef.current = window.setInterval(() => {
                const e = engineRef.current;
                const pending = pendingPlayRef.current;
                if (!e || !pending) { window.clearInterval(pendingPlayIntervalRef.current!); pendingPlayIntervalRef.current = null; return; }
                if (e.isAudioLoaded()) {
                  if (Math.abs(e.getAudioTime() - pending.time) > DRIFT_THRESHOLD) e.seek(pending.time);
                  e.play();
                  pendingPlayRef.current = null;
                  window.clearInterval(pendingPlayIntervalRef.current!);
                  pendingPlayIntervalRef.current = null;
                }
              }, 100);
            }
          }
        } else {
          pendingPlayRef.current = null;
          if (pendingPlayIntervalRef.current) { window.clearInterval(pendingPlayIntervalRef.current); pendingPlayIntervalRef.current = null; }
          eng.pause();
        }
      } else if (msg.type === "end") {
        setEnded(true);
        closeChannelRef.current?.();
      }
    };

    closeChannelRef.current = openViewerChannel(roomId, handleMessage);
    return () => {
      closeChannelRef.current?.();
      if (pendingPlayIntervalRef.current) { window.clearInterval(pendingPlayIntervalRef.current); pendingPlayIntervalRef.current = null; }
    };
  }, [roomId, loading, ended, notFound]);

  if (loading) return <div className="mage-page"><p className="mage-body">Joining room…</p></div>;
  if (notFound) return <div className="mage-page"><p className="mage-body">Room not found.</p></div>;
  if (ended)
    return (
      <div className="mage-page">
        <header className="mage-page__header">
          <div className="mage-page__title-group">
            <p className="mage-eyebrow"><span className="mage-eyebrow__num">05</span>Broadcast</p>
            <h1 className="mage-title">Broadcast Ended</h1>
          </div>
        </header>
        <p className="mage-body">The host has stopped broadcasting.</p>
      </div>
    );

  return (
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow"><span className="mage-eyebrow__num">05</span>Broadcast</p>
          <h1 className="mage-title">{room?.title ?? "Live Room"}</h1>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#e74c3c", fontWeight: 600 }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#e74c3c", animation: "pulse 1.5s infinite" }} />
          LIVE
        </span>
      </header>

      <EnginePlayer
        preset={currentPreset ?? undefined}
        audioSource={currentAudio ?? undefined}
        onEngineReady={(eng) => { engineRef.current = eng; }}
        readOnly
      />

      {!currentPreset && (
        <p className="mage-body" style={{ marginTop: "12px", color: "var(--mage-muted, #888)" }}>
          Waiting for host to load a preset…
        </p>
      )}
    </div>
  );
};

export default BroadcastViewer;
