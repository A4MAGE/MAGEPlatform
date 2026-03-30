import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
// @ts-ignore
import Search from "@search/search-bar-main";

const Dashboard = () => {
  const { session, signOut } = UserAuth();
  const [presetPath, setPresetPath] = useState("");
  const [audioSource, setAudioSource] = useState("");
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("preset").select("*").then(({ data, error }: { data: any; error: any }) => {
      if (!error && data) setPresets(data);
    });
  }, []);

  const handlePresetSelect = (item: any) => {
    if (item.audioSource) setAudioSource(item.audioSource);
  };

  return (
    <div className="dashboard-container">
      <div className="content-center-card">
        <h1>Dashboard</h1>
        <h2>Welcome, {session?.user?.email}</h2>
        <div onClick={signOut}>
          <button className="link-button">Sign Out</button>
        </div>
        <Search data={presets} onSelect={handlePresetSelect} />
        <EnginePlayer presetPath={presetPath} audioSource={audioSource} />
      </div>
      <PresetPreviews setPresetPath={setPresetPath} />
    </div>
  );
};

export default Dashboard;
