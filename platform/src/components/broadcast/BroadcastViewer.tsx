import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import EnginePlayer from "../mage engine/EnginePlayer";
import { subscribeToRoom, type RoomState } from "../../lib/ablyBroadcast";
import type { MAGEEngineAPI } from "@notrac/mage";

const LARGE_DRIFT = 3;

const BroadcastViewer = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [ended, setEnded] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<object | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [hostPlaying, setHostPlaying] = useState(false);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const shouldPlayRef = useRef(false);
  const targetTimeRef = useRef(0);
  const retryRef = useRef<number | null>(null);
  const lastPresetJsonRef = useRef<string | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);

  const clearRetry = () => {
    if (retryRef.current) { window.clearInterval(retryRef.current); retryRef.current = null; }
  };

  // Retries every 100ms until engine + audio are ready, then seeks + plays.
  // Safe to call multiple times — clears the previous retry each call.
  const startPlay = useCallback((time: number) => {
    console.log("[Viewer] startPlay time=", time);
    shouldPlayRef.current = true;
    targetTimeRef.current = time;
    clearRetry();
    retryRef.current = window.setInterval(() => {
      const eng = engineRef.current;
      const loaded = eng?.isAudioLoaded();
      if (!eng || !loaded) return;
      eng.seek(targetTimeRef.current);
      eng.play();
      clearRetry();
      console.log("[Viewer] ▶ playing at", targetTimeRef.current);
    }, 100);
  }, []);

  const tryPause = useCallback(() => {
    shouldPlayRef.current = false;
    clearRetry();
    engineRef.current?.pause();
    console.log("[Viewer] ⏸ paused");
  }, []);

  const applyState = useCallback((state: RoomState) => {
    console.log("[Viewer] state", {
      playing: state.playing,
      t: state.playbackTime,
      hasPreset: !!state.presetData,
      audioUrl: state.audioUrl ?? "(none)",
      ended: state.ended,
      shouldPlay: shouldPlayRef.current,
      audioLoaded: engineRef.current?.isAudioLoaded(),
    });

    if (state.ended) { setEnded(true); return; }

    // Only update preset if it actually changed (avoids reloading the engine every 2s)
    if (state.presetData) {
      const json = JSON.stringify(state.presetData);
      if (json !== lastPresetJsonRef.current) {
        lastPresetJsonRef.current = json;
        setCurrentPreset(state.presetData);
        console.log("[Viewer] preset updated");
      }
    }

    // Only update audio URL if it changed
    if (state.audioUrl && state.audioUrl !== lastAudioUrlRef.current) {
      console.log("[Viewer] audio URL arrived →", state.audioUrl);
      lastAudioUrlRef.current = state.audioUrl;
      setCurrentAudio(state.audioUrl);
      // If we're already supposed to be playing, restart the retry loop so it
      // picks up the newly-loaded audio (previous loop was spinning on null audio).
      if (shouldPlayRef.current) {
        console.log("[Viewer] audio arrived while playing — restarting retry loop");
        startPlay(targetTimeRef.current);
      }
    }

    setHostPlaying(state.playing);

    if (state.playing) {
      if (!shouldPlayRef.current) {
        // Transition paused → playing
        startPlay(state.playbackTime);
      } else {
        // Already in play mode — only correct large drift
        const eng = engineRef.current;
        if (eng?.isAudioLoaded()) {
          const drift = Math.abs(eng.getAudioTime() - state.playbackTime);
          if (drift > LARGE_DRIFT) {
            console.log("[Viewer] correcting drift", drift, "→ seek", state.playbackTime);
            eng.seek(state.playbackTime);
          }
        } else {
          // Audio not loaded yet — keep target time fresh
          targetTimeRef.current = state.playbackTime;
        }
      }
    } else {
      tryPause();
    }
  }, [startPlay, tryPause]);

  const onEngineReady = useCallback((eng: MAGEEngineAPI) => {
    console.log("[Viewer] engine ready, shouldPlay=", shouldPlayRef.current);
    engineRef.current = eng;
    if (shouldPlayRef.current) startPlay(targetTimeRef.current);
  }, [startPlay]);

  useEffect(() => {
    if (!roomId) return;
    const unsub = subscribeToRoom(roomId, applyState);
    return () => { unsub(); clearRetry(); };
  }, [roomId, applyState]);

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
          <h1 className="mage-title">Live Room</h1>
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

      <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--mage-cream-60)", display: "flex", flexDirection: "column", gap: "4px" }}>
        {!currentPreset && <span>⏳ Waiting for host to load a preset…</span>}
        {currentPreset && !currentAudio && hostPlaying && <span>⏳ Waiting for host to share audio…</span>}
        {currentPreset && !hostPlaying && <span>⏸ Host is paused</span>}
        {currentPreset && currentAudio && hostPlaying && <span>▶ Syncing audio…</span>}
      </div>
    </div>
  );
};

export default BroadcastViewer;
