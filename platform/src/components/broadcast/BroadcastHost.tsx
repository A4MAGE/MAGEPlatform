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
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const publicAudioUrlRef = useRef<string | null>(null);
  const activePresetRef = useRef<Preset | null>(null);
  const isPlayingRef = useRef(false);
  const syncIntervalRef = useRef<number | null>(null);
  // JS-level playback clock — more reliable than engine.getAudioTime()
  const playStartedAtRef = useRef<number | null>(null);
  const playOffsetRef = useRef<number>(0);

  useEffect(() => { activePresetRef.current = activePreset; }, [activePreset]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }, []);

  const getPlaybackTime = () => {
    if (!isPlayingRef.current || playStartedAtRef.current === null) return playOffsetRef.current;
    return playOffsetRef.current + (Date.now() - playStartedAtRef.current) / 1000;
  };

  const pushState = (overrides: Partial<{ playing: boolean; playbackTime: number }> = {}) => {
    if (!roomId) return;
    const playbackTime = overrides.playbackTime ?? getPlaybackTime();
    const state = {
      presetData: activePresetRef.current?.scene_data ?? null,
      audioUrl: publicAudioUrlRef.current,
      playing: overrides.playing ?? isPlayingRef.current,
      playbackTime,
      sentAt: Date.now(),
    };
    console.log("[Host] push", { hasPreset: !!state.presetData, audioUrl: state.audioUrl, playing: state.playing, t: playbackTime.toFixed(2) });
    publishState(roomId, state);
  };

  // Load presets — re-run when session arrives (auth loads async)
  useEffect(() => {
    if (!supabase || !session?.user) return;
    supabase
      .from("preset")
      .select("id, name, scene_data, thumbnail_url")
      .eq("user_id", session.user.id)
      .then(({ data, error }: any) => {
        if (error) console.error("[Host] presets load error:", error.message);
        if (!error && data) setPresets(data);
      });
  }, [session]);

  // Start broadcasting immediately on mount
  useEffect(() => {
    if (!roomId) return;
    setInitialized(true);
    syncIntervalRef.current = window.setInterval(() => pushState(), 2000);
    return () => { if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current); };
  }, [roomId]);

  // DB upsert for room list — non-blocking
  useEffect(() => {
    if (!supabase || !session?.user || !roomId) return;
    const title = `${session.user.email?.split("@")[0]}'s room`;
    supabase.from("broadcast_room")
      .upsert({ id: roomId, host_user_id: session.user.id, title, is_active: true }, { onConflict: "id" })
      .then(({ error: e }: any) => { if (e) console.warn("[Host] DB upsert failed:", e.message); });
  }, [roomId, session]);

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

  // File upload → Supabase Storage → public URL
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Always load locally for host playback
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blob = URL.createObjectURL(file);
    blobUrlRef.current = blob;

    if (!supabase || !roomId) {
      // No Supabase — can only play locally, can't share
      setUploadError("Storage not configured. Paste a public URL instead.");
      return;
    }

    setAudioUploading(true);
    setUploadError(null);

    // Ensure bucket exists (creates it if missing)
    const { error: bucketError } = await supabase.storage.createBucket("broadcast-audio", { public: true });
    if (bucketError && !bucketError.message.includes("already exists")) {
      console.warn("[Host] bucket create warning:", bucketError.message);
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${roomId}/${Date.now()}-${safeName}`;
    console.log("[Host] uploading:", path);
    const { data, error } = await supabase.storage.from("broadcast-audio").upload(path, file, { upsert: true });
    setAudioUploading(false);

    if (error || !data) {
      console.error("[Host] upload failed:", error?.message);
      setUploadError(`Upload failed: ${error?.message ?? "unknown error"}`);
      return;
    }

    const { data: urlData } = supabase.storage.from("broadcast-audio").getPublicUrl(data.path);
    const url = urlData.publicUrl;
    console.log("[Host] upload success, public URL:", url);
    publicAudioUrlRef.current = url;
    setAudioUrl(url);
    pushState();
  };

  // Direct URL paste — instant, no upload needed
  const handleUrlInput = (url: string) => {
    setAudioUrl(url);
    publicAudioUrlRef.current = url || null;
    setUploadError(null);
    pushState();
  };

  const handlePlay = () => {
    engineRef.current?.play();
    setIsPlaying(true);
    isPlayingRef.current = true;
    playStartedAtRef.current = Date.now();
    pushState({ playing: true, playbackTime: playOffsetRef.current });
  };

  const handlePause = () => {
    engineRef.current?.pause();
    // Capture position BEFORE flipping isPlayingRef — getPlaybackTime() uses it
    const frozenTime = getPlaybackTime();
    setIsPlaying(false);
    isPlayingRef.current = false;
    playOffsetRef.current = frozenTime;
    playStartedAtRef.current = null;
    pushState({ playing: false, playbackTime: frozenTime });
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

  // Local audio source for host engine: prefer blob (file upload) else the pasted URL
  const localAudioSource = blobUrlRef.current ?? (audioUrl || undefined);

  const shareUrl = `${window.location.origin}/broadcast/room/${roomId}`;
  const audioReady = !!publicAudioUrlRef.current;

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
                audioSource={localAudioSource}
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
                  {audioReady ? "Space to toggle" : "Add audio to share with viewers"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Audio section */}
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Audio</p>

                {/* File upload */}
                <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleFileUpload} />
                <button
                  type="button"
                  className="mage-audio-picker"
                  style={{ width: "100%", marginBottom: "6px", borderColor: audioReady ? "#2ecc71" : undefined }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={audioUploading}
                >
                  <span className="mage-audio-picker__label">
                    {audioUploading ? "Uploading…" : audioReady && blobUrlRef.current ? "✓ File uploaded" : "↑ Upload audio file"}
                  </span>
                </button>

                {/* URL paste — always works */}
                <input
                  type="url"
                  placeholder="Or paste a public audio URL"
                  value={audioUrl}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "var(--mage-cream-05)", border: "1px solid var(--mage-cream-10)",
                    borderRadius: "4px", padding: "6px 8px", fontSize: "11px",
                    color: "var(--mage-cream)", outline: "none",
                  }}
                />

                {uploadError && (
                  <p style={{ fontSize: "11px", color: "#e05c4a", marginTop: "4px" }}>{uploadError}</p>
                )}
                {audioReady && (
                  <p style={{ fontSize: "11px", color: "#2ecc71", marginTop: "4px" }}>✓ Audio ready — viewers will hear this</p>
                )}
              </div>

              {/* Preset list */}
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Your Presets</p>
                {presets.length === 0
                  ? <p style={{ fontSize: "12px", color: "var(--mage-muted, #888)" }}>No presets yet</p>
                  : <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
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

      {!initialized && <p className="mage-body">Setting up room…</p>}
    </div>
  );
};

export default BroadcastHost;
