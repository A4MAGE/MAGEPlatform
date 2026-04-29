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

type PlayerProps = {
  displayControls?: boolean,
};

const Player = ({ displayControls = false }: PlayerProps) => {
  const { session } = UserAuth();
  // Data related to the current preset being displayed on the screen.
  const [preset, setPreset] = useState<string | object | null>(null);
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [currentPresetName, setCurrentPresetName] = useState("");
  const [currentPresetDesc, setCurrentPresetDesc] = useState("");
  const [currentPresetAuthor, setCurrentPresetAuthor] = useState("");
  const [currentPresetId, setCurrentPresetId] = useState("");
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Data for saving preset to user account
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // References for changing audio files.
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  const autoCaptureThumbnail = async (item: any) => {
    const engine = engineRef.current;
    if (!engine || !supabase || !item.id || item.thumbnail_url) return;
    try {
      await new Promise((r) => setTimeout(r, 2000));
      const exported = engine.toPreset();
      const dataUrl = engine.captureThumbnail ? await engine.captureThumbnail(exported) : null;
      if (!dataUrl) return;
      const blob = dataUrlToBlob(dataUrl);
      const path = `${item.id}.png`;
      const { error: upErr } = await supabase.storage
        .from(THUMBNAIL_BUCKET)
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (upErr) return;
      const { data: urlData } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) return;
      await supabase.from("preset").update({ thumbnail_url: publicUrl }).eq("id", item.id);
    } catch (_) {}
  };

  const handlePresetSelect = (item: any) => {
    if (item.scene_data) {
      setPreset(item.scene_data);
      setCurrentPresetName(item.name);
      setCurrentPresetDesc(item.description);
      setCurrentPresetAuthor(item.username);
      setCurrentPresetId(item.id);
      if (!item.thumbnail_url) autoCaptureThumbnail(item);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else {
      setPreset(item);
      setCurrentPresetName("");
      setCurrentPresetDesc("");
      setCurrentPresetAuthor("");
      setCurrentPresetId("");
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

  const shareLink = currentPresetId ? `https://a4mage.github.io/player/${currentPresetId}` : "";

  const handleCopyShareLink = async () => {
    if (!shareLink) {
      setShareMsg("Select a preset first.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setShareMsg("Share link copied.");
    } catch (err) {
      console.error("Copy share link failed:", err);
      setShareMsg("Could not copy share link.");
    }
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
    // Don't apply mage-page class if displayControls is true - this means player is being used as a child component in Create.tsx which has a mage-page div.
    <div className={displayControls ? "" : "mage-page"}>
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">03</span>
            Player
          </p>
          <h1 className="mage-title">Player</h1>
        </div>
      </header>

      <div className="mage-grid-player">
        <div className="mage-stack mage-stack--lg">
          <div className="mage-search">
            {/* @ts-ignore */}
            <Search onSelect={handlePresetSelect} />
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

          <div className="mage-stack" ref={outputRef}>
            <p className="mage-eyebrow">
              <span className="mage-eyebrow__num">02</span>
              Output
            </p>
            <EnginePlayer
              preset={preset}
              audioSource={audioSource}
              displayControls={displayControls}
              onEngineReady={(e) => (engineRef.current = e)}
            />
            <div className="mage-preset-meta">
              <div className="mage-preset-meta__details">
                {currentPresetName && (
                  <div className="mage-preset-meta__name">{currentPresetName}</div>
                )}
                {currentPresetAuthor && (
                  <div className="mage-preset-meta__author">Created by {currentPresetAuthor}</div>
                )}
                {currentPresetDesc && (
                  <div className="mage-preset-meta__desc">{currentPresetDesc}</div>
                )}
              </div>
              <div className="mage-preset-meta__share">
                <button
                  type="button"
                  className="mage-btn mage-btn--ghost mage-btn--tiny"
                  onClick={handleCopyShareLink}
                  disabled={!shareLink}
                >
                  Copy Share Link
                </button>
                {shareMsg && <div className="mage-preset-meta__msg">{shareMsg}</div>}
              </div>
            </div>
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
