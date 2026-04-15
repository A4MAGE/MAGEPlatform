import { useEffect, useRef, useState } from "react";
// @ts-ignore
import AudioEngine from "@audio/AudioEngine";
// @ts-ignore
import AudioController from "@audio/AudioController";
import LoadingSpinner from "../LoadingSpinner";
import { initMAGE, type MAGEEngineAPI } from "mage";
import "./engine.css";

type EnginePlayerProps = {
  preset?: string;
  audioSource?: string;
  displayControls?: boolean;
  setCreatePresetEngineRef?: (engine: MAGEEngineAPI | null) => void;
};

const EnginePlayer = ({ preset, audioSource, displayControls = false, setCreatePresetEngineRef}: EnginePlayerProps) => {
  const canvasRef = useRef(null);
  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null);
  const [audioController, setAudioController] = useState<any>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;

    if (disposed || !canvasRef.current) return;

    const mageEngine = initMAGE({
      canvas: canvasRef.current,
      withControls: displayControls,
      autoStart: true,
    });
    setEngine(mageEngine);

    const ae = new AudioEngine();
    const ac = new AudioController(ae);
    setAudioController(ac);

    if (audioSource) {
      mageEngine.loadAudio(audioSource);
      ac.loadFromUrl(audioSource);
    }

    return () => {
      disposed = true;
      if (mageEngine) mageEngine.dispose();
    };
  }, []);

  useEffect(() => {
    if (audioSource && engine && audioController) {
      setAudioLoaded(false);
      engine.loadAudio(audioSource);
      audioController.loadFromUrl(audioSource);
      // TODO: Audio bugged right now and doesn't report when loaded
      setAudioLoaded(true);
    }
  }, [audioSource]);

  useEffect(() => {
    if (preset) loadPreset(preset);
  }, [preset]);

  useEffect(() => {
    if (setCreatePresetEngineRef) {
      setCreatePresetEngineRef(engine);
    }
  }, [engine]);

  const loadPreset = async (preset: any) => {
    if (!engine) return;
    engine.loadPreset(preset);
    if (audioController) audioController.loadPreset(preset);
  };

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
          className="mage-btn"
          onClick={() => {
            engine?.play();
            audioController?.play();
          }}
          disabled={!audioLoaded}
        >
          Play
        </button>
        <button
          type="button"
          className="mage-btn"
          onClick={() => {
            engine?.pause?.();
            audioController?.pause();
          }}
          disabled={!audioLoaded}
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default EnginePlayer;
