import { UserAuth } from "../context/AuthContext";
import EnginePlayer from "./mage engine/EnginePlayer";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import type { MAGEEngineAPI } from "@notrac/mage";

const THUMBNAIL_BUCKET = "preset-thumbnails";

const BASE_PRESET_URLS = Array.from({ length: 13 }, (_, i) => `presets/preset${i}.v2.json`);

function gradientForName(name = "") {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < name.length; i++) {
    h1 = (h1 * 31 + name.charCodeAt(i)) & 0xffff;
    h2 = (h2 * 17 + name.charCodeAt(i)) & 0xffff;
  }
  const hue1 = h1 % 360;
  const hue2 = (hue1 + 60 + (h2 % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1},55%,28%), hsl(${hue2},60%,18%))`;
}

const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const bytes = atob(base64);
  const buf = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
};

type PlayerProps = { displayControls?: boolean };

const Player = ({ displayControls = false }: PlayerProps) => {
  const { session } = UserAuth();
  const location = useLocation();
  const navPreset = (location.state as any)?.preset ?? null;

  const [preset, setPreset] = useState<string | object | null>(navPreset?.scene_data ?? null);
  const [audioSource, setAudioSource] = useState("");
  const [audioFileName, setAudioFileName] = useState("");
  const [currentPresetName, setCurrentPresetName] = useState(navPreset?.name ?? "");
  const [currentPresetDesc, setCurrentPresetDesc] = useState(navPreset?.description ?? "");
  const [currentPresetAuthor, setCurrentPresetAuthor] = useState(navPreset?.username ?? "");
  const [allPresets, setAllPresets] = useState<any[]>([]);
  const [basePresets, setBasePresets] = useState<{ label: string; data: object }[]>([]);

  // Side card state
  const [presetView, setPresetView] = useState<"community" | "base">("community");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Save state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.from("preset_with_username").select("*").then(({ data, error }: { data: any; error: any }) => {
      if (!error && data) setAllPresets(data);
    });
  }, []);

  useEffect(() => {
    Promise.all(
      BASE_PRESET_URLS.map(async (url, i) => {
        const res = await fetch(url);
        if (!res.ok) return null;
        return { label: `Preset ${i}`, data: await res.json() };
      })
    ).then(results => setBasePresets(results.filter(Boolean) as any));
  }, []);

  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [searchOpen]);

  const captureThumbnailForItem = async (item: any) => {
    const engine = engineRef.current;
    if (!engine?.captureThumbnail || !supabase || !item.id || !item.scene_data) return;
    try {
      const dataUrl = await engine.captureThumbnail(item.scene_data, { settleFrames: 10 });
      if (!dataUrl) return;
      const blob = dataUrlToBlob(dataUrl);
      const path = `${item.id}.png`;
      const { error: upErr } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
      if (upErr) return;
      const { data: urlData } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);
      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) return;
      await supabase.from("preset").update({ thumbnail_url: publicUrl }).eq("id", item.id);
    } catch (_) {}
  };

  const batchThumbnailDone = useRef(false);
  const onEngineReady = (e: MAGEEngineAPI) => {
    engineRef.current = e;
    if (batchThumbnailDone.current || !supabase || !e.captureThumbnail) return;
    batchThumbnailDone.current = true;
    supabase.from("preset_with_username").select("*").is("thumbnail_url", null)
      .then(async ({ data, error }: { data: any; error: any }) => {
        if (error || !data?.length) return;
        for (const item of data) {
          await captureThumbnailForItem(item);
          await new Promise((r) => setTimeout(r, 200));
        }
        const { data: fresh } = await supabase!.from("preset_with_username").select("*");
        if (fresh) setAllPresets(fresh);
      });
  };

  const handlePresetSelect = (item: any) => {
    if (item.scene_data) {
      setPreset(item.scene_data);
      setCurrentPresetName(item.name);
      setCurrentPresetDesc(item.description);
      setCurrentPresetAuthor(item.username);
      if (!item.thumbnail_url) captureThumbnailForItem(item);
    } else {
      setPreset(item);
      setCurrentPresetName("");
      setCurrentPresetDesc("");
      setCurrentPresetAuthor("");
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
    if (!engine || !supabase || !userId) { setSaveMsg("Not signed in or engine not ready."); return; }
    if (!presetName.trim()) { setSaveMsg("Name required."); return; }
    setSaving(true); setSaveMsg(null); setSaveModalOpen(false);
    try {
      const exported = engine.toPreset();
      const sceneData = JSON.parse(JSON.stringify(exported));
      const { data: inserted, error: insertErr } = await supabase
        .from("preset").insert({ user_id: userId, name: presetName.trim(), scene_data: sceneData })
        .select("id").single();
      if (insertErr || !inserted) throw insertErr ?? new Error("Insert failed");
      const presetId = inserted.id as number;
      const dataUrl = engine.captureThumbnail ? await engine.captureThumbnail(exported) : null;
      if (dataUrl) {
        const blob = dataUrlToBlob(dataUrl);
        const path = `${presetId}.png`;
        const { error: upErr } = await supabase.storage.from(THUMBNAIL_BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);
        const publicUrl = urlData?.publicUrl;
        if (publicUrl) {
          const { error: updErr } = await supabase.from("preset").update({ thumbnail_url: publicUrl }).eq("id", presetId);
          if (updErr) throw updErr;
        }
      }
      setPresetName(""); setSaveMsg(`Saved "${presetName.trim()}".`);
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed.");
    } finally { setSaving(false); }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredCommunity = q
    ? allPresets.filter(p => p.name?.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q))
    : allPresets;
  const filteredBase = q
    ? basePresets.filter(p => p.label.toLowerCase().includes(q))
    : basePresets;

  return (
    <div className={displayControls ? "" : "mage-page"}>
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">03</span>
            Player
          </p>
          <h1 className="mage-title">Visualizer</h1>
        </div>
      </header>

      <div className="mage-grid-player">

        {/* Left: engine + meta + save + audio */}
        <div className="mage-stack">

          <EnginePlayer
            preset={preset}
            audioSource={audioSource}
            displayControls={displayControls}
            onEngineReady={onEngineReady}
          />


          {(currentPresetName || currentPresetAuthor) && (
            <div className="mage-preset-meta">
              <div className="mage-preset-meta__details">
                {currentPresetName && <div className="mage-preset-meta__name">{currentPresetName}</div>}
                {currentPresetAuthor && <div className="mage-preset-meta__author">by {currentPresetAuthor}</div>}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioFileChange} aria-label="Pick audio file" />
            <button type="button" className="mage-audio-picker" style={{ flex: 1, border: "1px solid rgba(255,251,219,0.22)" }} onClick={() => fileInputRef.current?.click()}>
              <span className="mage-audio-picker__label">↑ Upload audio</span>
              {audioFileName
                ? <span className="mage-audio-picker__name">{audioFileName}</span>
                : <span className="mage-audio-picker__name mage-audio-picker__name--empty">No file selected</span>
              }
            </button>
            <button
              type="button"
              className="mage-btn mage-btn--primary"
              style={{ width: "auto", padding: "0 1.2rem", flexShrink: 0 }}
              onClick={() => setSaveModalOpen(true)}
              disabled={saving || !session?.user?.id}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {saveMsg && <p className="mage-save-msg">{saveMsg}</p>}

        </div>

        {/* Right: preset side card */}
        <div className="mage-preset-card">
          <div className="mage-preset-card__header">
            <div className="mage-preset-card__header-left">
              {!searchOpen && (
                <select
                  className="mage-preset-card__select"
                  value={presetView}
                  onChange={e => setPresetView(e.target.value as any)}
                >
                  <option value="community">Community</option>
                  <option value="base">Base Presets</option>
                </select>
              )}
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  className="mage-preset-card__search-input"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              )}
            </div>
            <button
              className="mage-preset-card__search-btn"
              aria-label={searchOpen ? "Close search" : "Search presets"}
              onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQuery(""); }}
            >
              {searchOpen
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              }
            </button>
          </div>

          <div className="mage-preset-card__list">
            {presetView === "community" && (searchOpen ? filteredCommunity : allPresets).map((p, i) => (
              <button key={p.id ?? i} className="mage-preset-card__item" onClick={() => handlePresetSelect(p)}>
                <div className="mage-preset-card__thumb" style={
                  p.thumbnail_url
                    ? { backgroundImage: `url(${p.thumbnail_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: gradientForName(p.name) }
                } />
                <div className="mage-preset-card__info">
                  <span className="mage-preset-card__name">{p.name}</span>
                  {p.username && <span className="mage-preset-card__author">{p.username}</span>}
                </div>
              </button>
            ))}
            {presetView === "base" && (searchOpen ? filteredBase : basePresets).map((p, i) => (
              <button key={i} className="mage-preset-card__item" onClick={() => handlePresetSelect(p.data)}>
                <div className="mage-preset-card__thumb" style={{ background: gradientForName(p.label) }} />
                <div className="mage-preset-card__info">
                  <span className="mage-preset-card__name">{p.label}</span>
                </div>
              </button>
            ))}
            {presetView === "community" && allPresets.length === 0 && (
              <p className="mage-preset-card__empty">Loading…</p>
            )}
          </div>
        </div>

      </div>

      {saveModalOpen && (
        <div className="mage-modal-backdrop" onClick={() => setSaveModalOpen(false)}>
          <div className="mage-modal" onClick={e => e.stopPropagation()}>
            <h2 className="mage-modal__title">Save preset</h2>
            <input
              className="mage-input mage-modal__input"
              placeholder="Name this preset…"
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
            <div className="mage-modal__actions">
              <button className="mage-btn mage-btn--ghost" style={{ width: "auto" }} onClick={() => setSaveModalOpen(false)}>Cancel</button>
              <button className="mage-btn mage-btn--primary" style={{ width: "auto", padding: "0.65rem 1.4rem" }} onClick={handleSave} disabled={!presetName.trim()}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Player;
