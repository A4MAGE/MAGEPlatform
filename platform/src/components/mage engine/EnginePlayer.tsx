import { useEffect, useRef, useState } from "react";
import LoadingSpinner from "../LoadingSpinner";
import { initMAGE, type MAGEEngineAPI } from "@notrac/mage";
import "./engine.css";

type EnginePlayerProps = {
  preset?: string | object | null;
  displayControls?: boolean;
  audioSource?: string;
  onEngineReady?: (engine: MAGEEngineAPI) => void;
};

const EnginePlayer = ({ displayControls = false, preset, audioSource, onEngineReady }: EnginePlayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const mageEngine = initMAGE({
      canvas: canvasRef.current,
      withControls: { active: displayControls, integrated: false },
      autoStart: true,
    });
    setEngine(mageEngine);
    onEngineReady?.(mageEngine);

    return () => {
      mageEngine.dispose();
    };
  }, []);

  useEffect(() => {
    if (!engine || !audioSource) return;
    setAudioLoaded(false);
    engine.loadAudio(audioSource);

    const intervalId = window.setInterval(() => {
      if (engine.isAudioLoaded()) {
        setAudioLoaded(true);
        window.clearInterval(intervalId);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [audioSource, engine]);

  useEffect(() => {
    if (engine && preset) engine.loadPreset(preset as any);
  }, [preset, engine]);

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
      <div className="mage-engine__controls">
        <button
          type="button"
          className="mage-btn mage-btn--icon"
          aria-label="Play"
          onClick={() => engine?.play()}
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
          onClick={() => engine?.pause()}
          disabled={!audioLoaded}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>
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
    </div>
  );
};

export default EnginePlayer;
