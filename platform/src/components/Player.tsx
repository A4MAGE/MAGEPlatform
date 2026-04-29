import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import PresetPreviews from "./PresetPreviews";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const navPreset = (location.state as any)?.preset ?? null;
  // Data related to the current preset being displayed on the screen.
  const [preset, setPreset] = useState<string | object | null>(
    navPreset?.scene_data ?? null
  );
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [currentPresetName, setCurrentPresetName] = useState(navPreset?.name ?? "");
  const [currentPresetDesc, setCurrentPresetDesc] = useState(navPreset?.description ?? "");
  const [currentPresetAuthor, setCurrentPresetAuthor] = useState(navPreset?.username ?? "");
  const [currentPresetId, setCurrentPresetId] = useState(navPreset?.id ?? "");
  const [allPresets, setAllPresets] = useState<any[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("preset_with_username").select("*").then(({ data, error }: { data: any; error: any }) => {
      if (!error && data) setAllPresets(data);
    });
  }, []);

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

  const captureThumbnailForItem = async (item: any) => {
    const engine = engineRef.current;
    if (!engine?.captureThumbnail || !supabase || !item.id || !item.scene_data) return;
    try {
      const dataUrl = await engine.captureThumbnail(item.scene_data, { settleFrames: 10 });
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

  // When the engine becomes ready, batch-generate thumbnails for any preset missing one,
  // then refresh allPresets so search results show the real thumbnails.
  const batchThumbnailDone = useRef(false);
  const onEngineReady = (e: MAGEEngineAPI) => {
    engineRef.current = e;
    if (batchThumbnailDone.current || !supabase || !e.captureThumbnail) return;
    batchThumbnailDone.current = true;
    supabase
      .from("preset_with_username")
      .select("*")
      .is("thumbnail_url", null)
      .then(async ({ data, error }: { data: any; error: any }) => {
        if (error || !data?.length) return;
        for (const item of data) {
          await captureThumbnailForItem(item);
          await new Promise((r) => setTimeout(r, 200));
        }
        // Refresh preset list so search shows real thumbnails
        const { data: fresh } = await supabase.from("preset_with_username").select("*");
        if (fresh) setAllPresets(fresh);
      });
  };

  const handlePresetSelect = (item: any) => {
    if (item.scene_data) {
      setPreset(item.scene_data);
      setCurrentPresetName(item.name);
      setCurrentPresetDesc(item.description);
      setCurrentPresetAuthor(item.username);
      setCurrentPresetId(item.id);
      if (!item.thumbnail_url) captureThumbnailForItem(item);
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
            <Search data={allPresets.length ? allPresets : undefined} onSelect={handlePresetSelect} />
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
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                type="button"
                className="mage-audio-picker"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1 }}
              >
                <span className="mage-audio-picker__label">↑ Upload Audio</span>
                <span
                  className={
                    "mage-audio-picker__name" +
                    (audioFileName ? "" : " mage-audio-picker__name--empty")
                  }
                >
                  {audioFileName || "No file chosen"}
                </span>
              </button>
              <div className="mage-save-row" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="mage-input"
                  placeholder="Name this preset…"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  disabled={saving}
                />
                <button
                  type="button"
                  className="mage-btn mage-btn--primary mage-save-row__btn"
                  onClick={handleSave}
                  disabled={saving || !session?.user?.id}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
            {saveMsg && <p className="mage-save-msg">{saveMsg}</p>}
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
              onEngineReady={onEngineReady}
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
            </div>
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
