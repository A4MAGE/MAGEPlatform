import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import Search from "@search/search-bar-main";


const Player = () => {
  const { session, signOut } = UserAuth();
  const [preset, setPreset] = useState<any>("");
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  // Release the previous blob URL whenever audioSource changes or on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const handlePresetSelect = (item: any) => {
    // Item could either be a raw json object or a item object with both scene data and audio source.
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
      <div className="content-center-card">
        <h1>Player</h1>
        <h2>Welcome, {session?.user?.email}</h2>
        <div onClick={signOut}>
          <button className="link-button">Sign Out</button>
        </div>
        {/*  @ts-ignore */}
        <Search onSelect={handlePresetSelect} />

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleAudioFileChange}
        />
        <button
          className="link-button"
          onClick={() => fileInputRef.current?.click()}
        >
          {audioFileName ? `Audio: ${audioFileName}` : "Pick audio file"}
        </button>

        <EnginePlayer preset={preset} audioSource={audioSource} />
      </div>
      <PresetPreviews onSelect={handlePresetSelect} />
    </div>
  );
};

export default Player;
