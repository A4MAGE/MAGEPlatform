import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import Search from "@search/search-bar-main";
import "./Player.css";

const Player = () => {
  const { session, signOut } = UserAuth();
  const [preset, setPreset] = useState<any>("");
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handlePresetSelect = (item: any) => {
    if (item.scene_data) {
      setPreset(item.scene_data);
    } else {
      setPreset(item);
    }
    if (item.audioSource) setAudioSource(item.audioSource);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;

    setAudioFileName(file.name);
    setAudioSource(blobUrl);
  };

  return (
    <div className="dashboard-container">
      <div className="content-center-card player-card">
        <h1>Player</h1>
        <p className="player-welcome">Signed in as {session?.user?.email}</p>

        {/*  @ts-ignore */}
        <Search onSelect={handlePresetSelect} />

        <div className="player-divider" />

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleAudioFileChange}
          aria-label="Pick audio file"
        />
        <button
          type="button"
          className="player-audio-button"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="player-audio-label">
            {audioFileName ? "Audio file" : "Audio"}
          </span>
          <span className="player-audio-filename">
            {audioFileName || "Pick an audio file…"}
          </span>
        </button>

        <EnginePlayer preset={preset} audioSource={audioSource} />

        <button type="button" className="player-signout" onClick={signOut}>
          Sign Out
        </button>
      </div>
      <PresetPreviews onSelect={handlePresetSelect} />
    </div>
  );
};

export default Player;
