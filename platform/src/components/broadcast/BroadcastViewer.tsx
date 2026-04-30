import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import EnginePlayer from "../mage engine/EnginePlayer";
import { subscribeToRoom, type RoomState } from "../../lib/ablyBroadcast";
import type { MAGEEngineAPI } from "@notrac/mage";

const DRIFT = 0.3;

const BroadcastViewer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [title] = useState("Live Room");
  const [ended, setEnded] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<object | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const shouldPlayRef = useRef(false);
  const targetTimeRef = useRef(0);
  const retryRef = useRef<number | null>(null);

  const clearRetry = () => { if (retryRef.current) { window.clearInterval(retryRef.current); retryRef.current = null; } };

  const tryPlay = (time: number) => {
    shouldPlayRef.current = true;
    targetTimeRef.current = time;
    clearRetry();
    retryRef.current = window.setInterval(() => {
      const eng = engineRef.current;
      if (!eng || !eng.isAudioLoaded()) return;
      if (Math.abs(eng.getAudioTime() - targetTimeRef.current) > DRIFT) eng.seek(targetTimeRef.current);
      eng.play();
      clearRetry();
    }, 100);
  };

  const tryPause = () => {
    shouldPlayRef.current = false;
    clearRetry();
    engineRef.current?.pause();
  };

  const applyState = (state: RoomState) => {
    if (state.ended) { setEnded(true); return; }
    if (state.presetData) setCurrentPreset(state.presetData);
    if (state.audioUrl) setCurrentAudio(state.audioUrl);
    if (state.playing) tryPlay(state.playbackTime);
    else tryPause();
  };

  const onEngineReady = (eng: MAGEEngineAPI) => {
    engineRef.current = eng;
    if (shouldPlayRef.current) tryPlay(targetTimeRef.current);
  };

  useEffect(() => {
    if (!roomId) return;
    // rewind:1 in subscribeToRoom means Ably replays the last published state
    // immediately on subscribe — late joiners get it within milliseconds
    const unsub = subscribeToRoom(roomId, applyState);
    return () => { unsub(); clearRetry(); };
  }, [roomId]);

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
        onEngineReady={onEngineReady}
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
