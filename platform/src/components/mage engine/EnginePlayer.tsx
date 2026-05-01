import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import { initMAGE, type MAGEEngineAPI } from "@notrac/mage";
import "./engine.css";

function fmt(secs: number) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type EnginePlayerProps = {
  preset?: string | object | null;
  displayControls?: boolean;
  audioSource?: string;
  onEngineReady?: (engine: MAGEEngineAPI) => void;
  onAudioLoaded?: () => void;
  readOnly?: boolean;
};

const EnginePlayer = ({ displayControls = false, preset, audioSource, onEngineReady, onAudioLoaded, readOnly = false }: EnginePlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  const playStartRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // TODO: Remove this when this bug is patched in MAGE engine that causes crashing on mac
    // Workaround for a @notrac/mage non-Windows initialization bug where
    // switchControls() expects an element with id="ui_hide" to exist.
    let shimHideButton: HTMLButtonElement | null = null;
    if (!document.getElementById("ui_hide")) {
      shimHideButton = document.createElement("button");
      shimHideButton.id = "ui_hide";
      shimHideButton.type = "button";
      shimHideButton.setAttribute("data-mage-shim", "true");
      shimHideButton.style.display = "none";
      document.body.appendChild(shimHideButton);
    }

    const mageEngine = initMAGE({
      canvas: canvasRef.current,
      withControls: { active: displayControls, integrated: false },
      autoStart: true,
    });
    setEngine(mageEngine);
    onEngineReady?.(mageEngine);

    return () => {
      mageEngine.dispose();
      if (shimHideButton?.parentNode) {
        shimHideButton.parentNode.removeChild(shimHideButton);
      }
    };
  }, []);

  useEffect(() => {
    if (!engine || !audioSource) return;
    setAudioLoaded(false);
    setIsPlaying(false);
    accumulatedRef.current = 0;
    setElapsed(0);
    engine.loadAudio(audioSource);

    const audio = new Audio(audioSource);
    audio.onloadedmetadata = () => setDuration(audio.duration);

    const intervalId = window.setInterval(() => {
      if (engine.isAudioLoaded()) {
        setAudioLoaded(true);
        onAudioLoaded?.();
        window.clearInterval(intervalId);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [audioSource, engine]);

  useEffect(() => {
    if (engine && preset) engine.loadPreset(preset as any);
  }, [preset, engine]);

  useEffect(() => {
    if (isPlaying) {
      playStartRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        const sinceStart = (Date.now() - (playStartRef.current ?? Date.now())) / 1000;
        const next = accumulatedRef.current + sinceStart;
        if (duration > 0 && next >= duration) {
          setElapsed(duration);
          accumulatedRef.current = duration;
          playStartRef.current = null;
          setIsPlaying(false);
        } else {
          setElapsed(next);
        }
      }, 250);
    } else {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (playStartRef.current !== null) {
        accumulatedRef.current += (Date.now() - playStartRef.current) / 1000;
        playStartRef.current = null;
      }
    }
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, [isPlaying, duration]);

  const handlePlay = () => {
    if (duration > 0 && accumulatedRef.current >= duration - 0.5) {
      accumulatedRef.current = 0;
      setElapsed(0);
    }
    engine?.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    engine?.pause();
    setIsPlaying(false);
  };

  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  return (
    <div className="mage-engine">
      <div className="mage-engine__frame">
        {!engine && (
          <div className="engine-player-loading">
            <LoadingSpinner />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="engine-player"
          style={{ display: engine ? "block" : "none" }}
        />
      </div>
      {!readOnly && (
        <div className="mage-engine__controls">
          <button
            type="button"
            className="mage-btn mage-btn--icon"
            aria-label="Play"
            onClick={handlePlay}
            disabled={!audioLoaded}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>
          <button
            type="button"
            className="mage-btn mage-btn--icon"
            aria-label="Pause"
            onClick={handlePause}
            disabled={!audioLoaded}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
          <div className="mage-engine__progress-track">
            <div className="mage-engine__progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="mage-engine__timestamp">
            {fmt(elapsed)}{duration > 0 ? ` / ${fmt(duration)}` : ""}
          </span>
          <button
            type="button"
            className="mage-btn--icon-ghost"
            aria-label="Toggle fullscreen"
            onClick={() => engine?.toggleFullscreen()}
            disabled={!engine}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default EnginePlayer;
