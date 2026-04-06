import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
// @ts-ignore
import Search from "@search/search-bar-main";

const Player = () => {
  const [presetPath, setPresetPath] = useState("");
  const [audioSource, setAudioSource] = useState("");
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from("preset_with_username")
      .select("*")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data) setPresets(data);
      });
  }, []);

  const handlePresetSelect = (item: any) => {
    if (item.audioSource) setAudioSource(item.audioSource);
  };

  return (
    <div className="dashboard-container">
      <div className="content-center-card">
        <h1>Player</h1>
        <Search data={presets} onSelect={handlePresetSelect} />
        <EnginePlayer presetPath={presetPath} audioSource={audioSource} />
      </div>
      <PresetPreviews setPresetPath={setPresetPath} />
    </div>
  );
};

export default Player;
