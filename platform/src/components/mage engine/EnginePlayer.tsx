import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { initMAGE } from "./mage-engine.mjs";
// @ts-ignore
import AudioEngine from "@audio/AudioEngine";
// @ts-ignore
import AudioController from "@audio/AudioController";
import LoadingSpinner from "../LoadingSpinner";
import "./engine.css";

type EnginePlayerProps = {
  width?: string;
  height?: string;
  presetPath?: string;
  displayControls?: boolean;
  audioSource?: string;
};

const EnginePlayer = ({
  width = "500px",
  height = "250px",
  displayControls = false,
  presetPath,
  audioSource,
}: EnginePlayerProps) => {
  const canvasRef = useRef(null);
  const [engine, setEngine] = useState<any>(null);
  const [audioController, setAudioController] = useState<any>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { engine: mageEngine } = initMAGE({
      canvas: canvasRef.current,
      withControls: displayControls,
      autoStart: true,
      options: { log: true },
    });

    setEngine(mageEngine);

    const ae = new AudioEngine();
    const ac = new AudioController(ae);
    setAudioController(ac);

    const defaultUrl =
      "https://bnovkavuiekmkanohxpm.supabase.co/storage/v1/object/public/TempPublicMusic/rick.mp3";
    mageEngine.loadAudio(defaultUrl, () => setAudioLoaded(true));
    ac.loadFromUrl(defaultUrl);

    return () => {
      if (mageEngine) mageEngine.dispose();
    };
  }, []);

  // When a preset's audio source changes, reload both players
  useEffect(() => {
    if (audioSource && engine && audioController) {
      setAudioLoaded(false);
      engine.loadAudio(audioSource, () => setAudioLoaded(true));
      audioController.loadFromUrl(audioSource);
    }
  }, [audioSource]);

  useEffect(() => {
    if (presetPath) loadPreset(presetPath);
  }, [presetPath]);

  const loadPreset = async (path: string) => {
    if (!engine) return;
    const preset = await fetch(path).then((r) => r.json());
    engine.loadPreset(preset);
    if (audioController) audioController.loadPreset(preset);
  };

  return (
    <div>
      <div style={{ display: !engine ? "block" : "none", width, height }}>
        <LoadingSpinner />
      </div>
      <div style={{ display: engine ? "block" : "none", width, height }}>
        <canvas ref={canvasRef} className="engine-player" />
      </div>
      <button
        className="link-button"
        onClick={() => { engine?.play(); audioController?.play(); }}
        disabled={!audioLoaded}
      >
        Play
      </button>
      <button
        className="link-button"
        onClick={() => { engine?.pause?.(); audioController?.pause(); }}
        disabled={!audioLoaded}
      >
        Pause
      </button>
    </div>
  );
};

export default EnginePlayer;
