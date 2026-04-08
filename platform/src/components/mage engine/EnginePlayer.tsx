import { useEffect, useRef, useState } from "react";
// @ts-ignore
import AudioEngine from "@audio/AudioEngine";
// @ts-ignore
import AudioController from "@audio/AudioController";
import LoadingSpinner from "../LoadingSpinner";
import "./engine.css";

// Load mage-engine at runtime from public/ to avoid Rollup transforming eval() scopes
function loadMageEngine(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).__mageEngineModule) {
      resolve((window as any).__mageEngineModule);
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.textContent = `
      import { initMAGE, MAGEEngine, MAGEPreset } from "${import.meta.env.BASE_URL}mage-engine.mjs";
      window.__mageEngineModule = { initMAGE, MAGEEngine, MAGEPreset };
      window.dispatchEvent(new Event("mage-engine-loaded"));
    `;
    window.addEventListener("mage-engine-loaded", () => {
      resolve((window as any).__mageEngineModule);
    }, { once: true });
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

type EnginePlayerProps = {
  preset?: string;
  displayControls?: boolean;
  audioSource?: string;
};

const EnginePlayer = ({
  displayControls = false,
  preset,
  audioSource,
}: EnginePlayerProps) => {
  const canvasRef = useRef(null);
  const [engine, setEngine] = useState<any>(null);
  const [audioController, setAudioController] = useState<any>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    let disposed = false;
    let mageEngine: any = null;

    loadMageEngine().then(({ initMAGE }) => {
      if (disposed || !canvasRef.current) return;

      const result = initMAGE({
        canvas: canvasRef.current,
        withControls: displayControls,
        autoStart: true,
        options: { log: true },
      });
      mageEngine = result.engine;
      setEngine(mageEngine);

      const ae = new AudioEngine();
      const ac = new AudioController(ae);
      setAudioController(ac);

      if (audioSource) {
        mageEngine.loadAudio(audioSource, () => setAudioLoaded(true));
        ac.loadFromUrl(audioSource);
      }
    });

    return () => {
      disposed = true;
      if (mageEngine) mageEngine.dispose();
    };
  }, []);

  useEffect(() => {
    if (audioSource && engine && audioController) {
      setAudioLoaded(false);
      engine.loadAudio(audioSource, () => setAudioLoaded(true));
      audioController.loadFromUrl(audioSource);
    }
  }, [audioSource]);

  useEffect(() => {
    if (preset) loadPreset(preset);
  }, [preset]);

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
          onClick={() => { engine?.play(); audioController?.play(); }}
          disabled={!audioLoaded}
        >
          Play
        </button>
        <button
          type="button"
          className="mage-btn"
          onClick={() => { engine?.pause?.(); audioController?.pause(); }}
          disabled={!audioLoaded}
        >
          Pause
        </button>
      </div>
    </div>
  );
};

export default EnginePlayer;
