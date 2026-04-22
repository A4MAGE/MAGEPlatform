import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import type { MAGEEngineAPI } from "@notrac/mage";
// @ts-ignore
import Search from "@search/search-bar-main";

const THUMBNAIL_BUCKET = "preset-thumbnails";

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

const Player = () => {
  const { session, signOut } = UserAuth();
  const [preset, setPreset] = useState<string | object | null>(null);
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const engineRef = useRef<MAGEEngineAPI | null>(null);

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

  const handleSave = async () => {
    const engine = engineRef.current;
    const userId = session?.user?.id;
    if (!engine || !supabase || !userId) {
      setSaveMsg("Not signed in or engine not ready.");
      return;
    }
    if (!presetName.trim()) {
      setSaveMsg("Name required.");
      return;
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      const exported = engine.toPreset();
      const sceneData = JSON.parse(JSON.stringify(exported));

      const { data: inserted, error: insertErr } = await supabase
        .from("preset")
        .insert({ user_id: userId, name: presetName.trim(), scene_data: sceneData })
        .select("id")
        .single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Insert failed");
      const presetId = inserted.id as number;

      const dataUrl = engine.captureThumbnail
        ? await engine.captureThumbnail(exported)
        : null;
      if (dataUrl) {
        const blob = dataUrlToBlob(dataUrl);
        const path = `${presetId}.png`;
        const { error: upErr } = await supabase.storage
          .from(THUMBNAIL_BUCKET)
          .upload(path, blob, { upsert: true, contentType: blob.type });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from(THUMBNAIL_BUCKET)
          .getPublicUrl(path);
        const publicUrl = urlData?.publicUrl;
        if (publicUrl) {
          const { error: updErr } = await supabase
            .from("preset")
            .update({ thumbnail_url: publicUrl })
            .eq("id", presetId);
          if (updErr) throw updErr;
        }
      }

      setPresetName("");
      setSaveMsg(`Saved "${presetName.trim()}".`);
    } catch (err) {
      console.error("Save preset failed:", err);
      setSaveMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
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
            <EnginePlayer
              preset={preset}
              audioSource={audioSource}
              onEngineReady={(e) => (engineRef.current = e)}
            />
          </div>

          <div className="mage-stack">
            <p className="mage-eyebrow">
              <span className="mage-eyebrow__num">04</span>
              Save Preset
            </p>
            <div className="mage-save-row">
              <input
                type="text"
                className="mage-input"
                placeholder="Preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                disabled={saving}
              />
              <button
                type="button"
                className="mage-btn"
                onClick={handleSave}
                disabled={saving || !session?.user?.id}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            {saveMsg && <p className="mage-save-msg">{saveMsg}</p>}
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
