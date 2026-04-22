import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useEffect, useRef, useState } from "react";
// @ts-ignore
import Search from "@search/search-bar-main";

const Player = () => {
  const { session, signOut } = UserAuth();
  const [preset, setPreset] = useState<string | object | null>(null);
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
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">03</span>
            Player
          </p>
          <h1 className="mage-title">{session?.user?.email}</h1>
        </div>
        <button
          type="button"
          className="mage-btn mage-btn--quiet"
          onClick={signOut}
        >
          Sign Out
        </button>
      </header>

      <div className="mage-grid-player">
        <div className="mage-stack mage-stack--lg">
          <div className="mage-stack">
            <p className="mage-eyebrow">
              <span className="mage-eyebrow__num">01</span>
              Search Presets
            </p>
            <div className="mage-search">
              {/* @ts-ignore */}
              <Search onSelect={handlePresetSelect} />
            </div>
          </div>

          <div className="mage-stack">
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
              className="mage-audio-picker"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="mage-audio-picker__label">Audio Source</span>
              <span
                className={
                  "mage-audio-picker__name" +
                  (audioFileName ? "" : " mage-audio-picker__name--empty")
                }
              >
                {audioFileName || "No file selected — click to choose"}
              </span>
            </button>
          </div>

          <div className="mage-stack">
            <p className="mage-eyebrow">
              <span className="mage-eyebrow__num">02</span>
              Output
            </p>
            <EnginePlayer preset={preset} audioSource={audioSource} />
          </div>
        </div>

        <div className="mage-stack">
          <PresetPreviews onSelect={handlePresetSelect} />
        </div>
      </div>
    </div>
  );
};

export default Player;
