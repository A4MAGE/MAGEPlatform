import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import EnginePlayer from "../mage engine/EnginePlayer";
import { openViewerSubscription, type RoomRow } from "../../lib/broadcastChannel";
import type { MAGEEngineAPI } from "@notrac/mage";

const DRIFT_THRESHOLD = 0.3;

const BroadcastViewer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [ended, setEnded] = useState(false);
  const [title, setTitle] = useState("Live Room");

  const [currentPreset, setCurrentPreset] = useState<object | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const pendingRef = useRef<{ time: number } | null>(null);
  const pendingTimerRef = useRef<number | null>(null);

  const applyPlayback = (playing: boolean, time: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    if (!playing) { eng.pause(); return; }
    if (eng.isAudioLoaded()) {
      if (Math.abs(eng.getAudioTime() - time) > DRIFT_THRESHOLD) eng.seek(time);
      eng.play();
    } else {
      // Queue until audio ready
      pendingRef.current = { time };
      if (!pendingTimerRef.current) {
        pendingTimerRef.current = window.setInterval(() => {
          const e = engineRef.current;
          const p = pendingRef.current;
          if (!e || !p) { window.clearInterval(pendingTimerRef.current!); pendingTimerRef.current = null; return; }
          if (e.isAudioLoaded()) {
            if (Math.abs(e.getAudioTime() - p.time) > DRIFT_THRESHOLD) e.seek(p.time);
            e.play();
            pendingRef.current = null;
            window.clearInterval(pendingTimerRef.current!);
            pendingTimerRef.current = null;
          }
        }, 100);
      }
    }
  };

  const applyRow = (row: Partial<RoomRow>) => {
    if (row.is_active === false) { setEnded(true); return; }
    if (row.current_preset_data) setCurrentPreset(row.current_preset_data);
    if (row.current_audio_url) setCurrentAudio(row.current_audio_url);
    if (row.title) setTitle(row.title);
    if (typeof row.is_playing === "boolean") {
      applyPlayback(row.is_playing, row.current_time ?? 0);
    }
  };

  // Load initial room state from DB
  useEffect(() => {
    if (!supabase || !roomId) return;
    supabase
      .from("broadcast_room")
      .select("*")
      .eq("id", roomId)
      .single()
      .then(({ data, error }: any) => {
        if (error || !data) { setNotFound(true); setLoading(false); return; }
        applyRow(data as RoomRow);
        setLoading(false);
      });
  }, [roomId]);

  // Subscribe to Postgres Changes — any DB row update fires immediately
  useEffect(() => {
    if (!roomId || loading || notFound) return;
    const unsub = openViewerSubscription(
      roomId,
      (row) => applyRow(row),
      (tick) => applyPlayback(tick.playing, tick.currentTime)
    );
    return () => {
      unsub();
      if (pendingTimerRef.current) window.clearInterval(pendingTimerRef.current);
    };
  }, [roomId, loading, notFound]);

  if (loading) return <div className="mage-page"><p className="mage-body">Joining room…</p></div>;
  if (notFound) return <div className="mage-page"><p className="mage-body">Room not found.</p></div>;
  if (ended) return (
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
          <h1 className="mage-title">{title}</h1>
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
        <p className="mage-body" style={{ marginTop: "12px", color: "var(--mage-cream-60)" }}>
          Waiting for host to load a preset…
        </p>
      )}
    </div>
  );
};

export default BroadcastViewer;
