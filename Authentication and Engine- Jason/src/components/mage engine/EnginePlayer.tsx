import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { initMAGE } from "./mage-engine.mjs";
import LoadingSpinner from "../LoadingSpinner";
import "./engine.css";

type EnginePlayerProps = {
  width?: string;
  height?: string;
  presetPath?: string;
  displayControls?: boolean;
};

const EnginePlayer = ({ width = "500px", height = "250px", displayControls = false, presetPath }: EnginePlayerProps) => {
  const canvasRef = useRef(null); // This will keep play button disabled when canvas ref is null
  const [engine, setEngine] = useState<any>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const { engine } = initMAGE({
      canvas: canvasRef.current,
      withControls: displayControls,
      autoStart: true,
      options: {
        log: true,
      },
    });

    setEngine(engine);

    engine.loadAudio(
      "https://bnovkavuiekmkanohxpm.supabase.co/storage/v1/object/public/TempPublicMusic/rick.mp3",
      setAudioLoaded,
    );

    return () => {
      // Ensure audio/context is torn down when this component unmounts.
      if (engine) {
        engine.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (presetPath) {
      loadPreset(presetPath);
    }
  }, [presetPath])

  const playAudio = () => {
    if (!engine || !audioLoaded) return;
    engine.play();
  };

  const loadPreset = async (presetPath: any) => {
    if (!engine) return;
    const preset = await fetch(presetPath).then(response => response.json());
    engine.loadPreset(preset);
  }

  // Canvas is hidden using display property and not conditional rendering to avoid issues with the canvas ref.
  // Using conditional rendering causes issues with the engine finding the right canvas ref in the DOM.
  return (
    <div>
      <div style={{display: !engine ? "block" : "none", width: width, height: height}}>
        <LoadingSpinner />
      </div>

      <div style={{display: engine ? "block" : "none", width: width, height: height }}>
        <canvas ref={canvasRef} className="engine-player"></canvas>
      </div>

      <button className="link-button" onClick={playAudio} disabled={!audioLoaded}>
        Play
      </button>
    </div>
  );
};

export default EnginePlayer;
