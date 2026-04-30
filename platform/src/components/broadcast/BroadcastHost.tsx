import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import EnginePlayer from "../mage engine/EnginePlayer";
import { publishState } from "../../lib/ablyBroadcast";
import type { MAGEEngineAPI } from "@notrac/mage";

type Preset = { id: number; name: string; scene_data: object; thumbnail_url?: string };

const BroadcastHost = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const publicAudioUrlRef = useRef<string | null>(null);
  const activePresetRef = useRef<Preset | null>(null);
  const isPlayingRef = useRef(false);
  const audioUploadingRef = useRef(false);
  const syncIntervalRef = useRef<number | null>(null);
  const sessionRef = useRef(session);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { activePresetRef.current = activePreset; }, [activePreset]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }, []);

  const pushState = (overrides: Partial<{ playing: boolean; playbackTime: number }> = {}) => {
    if (!roomId) return;
    // Don't publish during upload — viewers would get a stale null audioUrl
    if (audioUploadingRef.current) return;
    const state = {
      presetData: activePresetRef.current?.scene_data ?? null,
      audioUrl: publicAudioUrlRef.current,
      playing: overrides.playing ?? isPlayingRef.current,
      playbackTime: overrides.playbackTime ?? engineRef.current?.getAudioTime() ?? 0,
    };
    console.log("[Host] pushState →", { hasPreset: !!state.presetData, audioUrl: state.audioUrl, playing: state.playing, playbackTime: state.playbackTime });
    publishState(roomId, state);
  };

  // Load user presets
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user) return;
    supabase
      .from("preset")
      .select("id, name, scene_data, thumbnail_url")
      .eq("user_id", sessionRef.current.user.id)
      .then(({ data, error }: any) => { if (!error && data) setPresets(data); });
  }, []);

  // Create room in DB + start state sync interval
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user || !roomId) return;
    let active = true;

    const title = `${sessionRef.current.user.email?.split("@")[0]}'s room`;
    supabase
      .from("broadcast_room")
      .upsert({ id: roomId, host_user_id: sessionRef.current.user.id, title, is_active: true }, { onConflict: "id" })
      .then(({ error: e }: any) => {
        if (!active) return;
        if (e) { setRoomError(e.message); return; }
        setInitialized(true);

        // Publish full state every 2s — Ably rewind:1 ensures late joiners always get it
        syncIntervalRef.current = window.setInterval(() => pushState(), 2000);
      });

    return () => {
      active = false;
      doStop(false);
    };
  }, [roomId]);

  useBlocker(({ currentLocation, nextLocation }) =>
    initialized &&
    currentLocation.pathname !== nextLocation.pathname &&
    !window.confirm("You're still live. Leaving will stop the broadcast.")
  );

  useEffect(() => {
    if (!initialized) return;
    const onUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [initialized]);

  const doStop = (nav = true) => {
    if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current);
    if (roomId) publishState(roomId, { presetData: null, audioUrl: null, playing: false, playbackTime: 0, ended: true });
    if (supabase && roomId) supabase.from("broadcast_room").update({ is_active: false }).eq("id", roomId);
    if (nav) navigate("/broadcast");
  };

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset);
    activePresetRef.current = preset;
    pushState();
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !roomId) return;

    console.log("[Host] audio file selected:", file.name, "size:", file.size);

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = URL.createObjectURL(file);
    blobUrlRef.current = blob;
    setAudioFileName(file.name);
    setLocalAudioUrl(blob);

    audioUploadingRef.current = true;
    setAudioUploading(true);
    const path = `${roomId}/${Date.now()}-${file.name}`;
    console.log("[Host] uploading to path:", path);
    const { data, error } = await supabase.storage.from("broadcast-audio").upload(path, file, { upsert: true });
    audioUploadingRef.current = false;
    setAudioUploading(false);
    if (error || !data) {
      console.error("[Host] upload FAILED:", error?.message, error);
      setAudioUploadError(error?.message ?? "Upload failed");
      setAudioReady(false);
      return;
    }

    console.log("[Host] upload SUCCESS, data.path:", data.path);
    const { data: urlData } = supabase.storage.from("broadcast-audio").getPublicUrl(data.path);
    publicAudioUrlRef.current = urlData.publicUrl;
    console.log("[Host] public URL set →", urlData.publicUrl);
    setAudioUploadError(null);
    setAudioReady(true);
    pushState(); // now safe — upload done, URL is set
  };

  const handlePlay = () => {
    engineRef.current?.play();
    setIsPlaying(true);
    isPlayingRef.current = true;
    pushState({ playing: true, playbackTime: engineRef.current?.getAudioTime() ?? 0 });
  };

  const handlePause = () => {
    engineRef.current?.pause();
    setIsPlaying(false);
    isPlayingRef.current = false;
    pushState({ playing: false, playbackTime: engineRef.current?.getAudioTime() ?? 0 });
  };

  const togglePlayPause = () => isPlaying ? handlePause() : handlePlay();

  useEffect(() => {
    if (!initialized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      e.preventDefault();
      togglePlayPause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [initialized, isPlaying]);

  const shareUrl = `${window.location.origin}/broadcast/room/${roomId}`;

  if (roomError) return (
    <div className="mage-page">
      <p className="mage-body" style={{ color: "#e74c3c" }}>Could not start room: {roomError}</p>
    </div>
  );

  return (
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow"><span className="mage-eyebrow__num">05</span>Broadcast</p>
          <h1 className="mage-title">You're Live</h1>
        </div>
      </header>

      {initialized && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
            <div>
              <EnginePlayer
                preset={activePreset?.scene_data ?? null}
                audioSource={localAudioUrl}
                onEngineReady={(e) => { engineRef.current = e; }}
                displayControls={false}
                readOnly
              />
              <div className="mage-engine__controls" style={{ marginTop: "8px" }}>
                <button type="button" className="mage-btn--icon" aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlayPause}>
                  {isPlaying
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  }
                </button>
                <span style={{ fontSize: "11px", color: audioReady ? "var(--mage-cream-40)" : "#e05c4a", marginLeft: "6px" }}>
                  {audioReady ? "Space to toggle" : "Upload audio to enable playback"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Audio</p>
                <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioFileChange} />
                <button type="button" className="mage-audio-picker" style={{ width: "100%", borderColor: audioUploadError ? "#e05c4a" : audioReady ? "#2ecc71" : undefined }} onClick={() => fileInputRef.current?.click()} disabled={audioUploading}>
                  <span className="mage-audio-picker__label">
                    {audioUploading ? "Uploading…" : audioReady ? "✓ Audio Ready" : "↑ Upload Audio"}
                  </span>
                  {audioUploadError && <span className="mage-audio-picker__name" style={{ color: "#e05c4a" }}>Error: {audioUploadError}</span>}
                  {!audioUploadError && audioFileName && <span className="mage-audio-picker__name">{audioUploading ? "Sharing with viewers…" : audioFileName}</span>}
                </button>
              </div>

              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Your Presets</p>
                {presets.length === 0
                  ? <p style={{ fontSize: "12px", color: "var(--mage-muted, #888)" }}>No presets yet</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto" }}>
                      {presets.map((p) => (
                        <button key={p.id} type="button" className="mage-btn" onClick={() => handlePresetSelect(p)}
                          style={{ textAlign: "left", background: activePreset?.id === p.id ? "var(--mage-accent, #6c63ff)" : undefined }}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <code onClick={() => navigator.clipboard.writeText(shareUrl)} title="Click to copy"
              style={{ flex: 1, background: "var(--mage-cream-05)", border: "1px solid var(--mage-cream-10)", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", wordBreak: "break-all", cursor: "pointer", color: "var(--mage-cream-60)" }}>
              {shareUrl}
            </code>
            <button type="button" onClick={() => doStop(true)}
              style={{ flexShrink: 0, background: "transparent", border: "1px solid rgba(192,57,43,0.4)", color: "#e05c4a", borderRadius: "4px", padding: "0.4rem 0.9rem", fontSize: "0.8rem", cursor: "pointer", whiteSpace: "nowrap" }}>
              Stop Broadcasting
            </button>
          </div>
        </>
      )}

      {!initialized && !roomError && <p className="mage-body">Setting up room…</p>}
    </div>
  );
};

export default BroadcastHost;
