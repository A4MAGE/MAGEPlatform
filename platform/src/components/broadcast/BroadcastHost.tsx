import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import EnginePlayer from "../mage engine/EnginePlayer";
import { pushRoomState, openHostTicker } from "../../lib/broadcastChannel";
import type { MAGEEngineAPI } from "@notrac/mage";

type Preset = { id: number; name: string; scene_data: object; thumbnail_url?: string };

const BroadcastHost = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null);
  const engineRef = useRef<MAGEEngineAPI | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const tickerRef = useRef<{ tick: (t: any) => void; close: () => void } | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Keep engineRef current
  useEffect(() => { engineRef.current = engine; }, [engine]);

  // Revoke blob URL on unmount
  useEffect(() => () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); }, []);

  // Load user presets
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user) return;
    supabase
      .from("preset")
      .select("id, name, scene_data, thumbnail_url")
      .eq("user_id", sessionRef.current.user.id)
      .then(({ data, error }: any) => { if (!error && data) setPresets(data); });
  }, []);

  // Create room row + open ticker on mount
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user || !roomId) return;
    let active = true;

    const title = `${sessionRef.current.user.email?.split("@")[0]}'s room`;
    supabase
      .from("broadcast_room")
      .upsert(
        { id: roomId, host_user_id: sessionRef.current.user.id, title, is_active: true, is_playing: false, current_time: 0 },
        { onConflict: "id" }
      )
      .then(({ error: e }: any) => {
        if (!active) return;
        if (e) { setRoomError(e.message); return; }
        tickerRef.current = openHostTicker(roomId);
        setInitialized(true);
      });

    return () => {
      active = false;
      doStop(false);
    };
  }, [roomId]);

  // Playback tick — sends current time to viewers for drift correction
  useEffect(() => {
    if (!isPlaying || !initialized) return;
    tickIntervalRef.current = window.setInterval(() => {
      const t = engineRef.current?.getAudioTime() ?? 0;
      tickerRef.current?.tick({ type: "tick", currentTime: t, playing: true });
    }, 500);
    return () => { if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current); };
  }, [isPlaying, initialized]);

  useBlocker(
    ({ currentLocation, nextLocation }) =>
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
    if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    tickerRef.current?.close();
    if (supabase && roomId) {
      pushRoomState(roomId, { is_active: false, is_playing: false });
    }
    if (nav) navigate("/broadcast");
  };

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset);
    if (roomId) pushRoomState(roomId, { current_preset_data: preset.scene_data });
  };

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !roomId) return;

    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setAudioFileName(file.name);
    setLocalAudioUrl(blobUrl);

    setAudioUploading(true);
    const path = `${roomId}/${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage
      .from("broadcast-audio")
      .upload(path, file, { upsert: true });

    setAudioUploading(false);
    if (uploadError || !data) {
      console.error("Audio upload failed:", uploadError?.message);
      return;
    }

    const { data: urlData } = supabase.storage.from("broadcast-audio").getPublicUrl(data.path);
    const publicUrl = urlData.publicUrl;

    // Write public URL to DB — viewers subscribed to Postgres Changes get it instantly
    pushRoomState(roomId, { current_audio_url: publicUrl });
  };

  const handlePlay = () => {
    engineRef.current?.play();
    setIsPlaying(true);
    if (roomId) pushRoomState(roomId, { is_playing: true, current_time: engineRef.current?.getAudioTime() ?? 0 });
  };

  const handlePause = () => {
    engineRef.current?.pause();
    setIsPlaying(false);
    if (roomId) pushRoomState(roomId, { is_playing: false, current_time: engineRef.current?.getAudioTime() ?? 0 });
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
      <p className="mage-body" style={{ color: "#e74c3c" }}>
        Could not start room: {roomError}. Run the SQL in database/broadcast_room_v2.sql in Supabase.
      </p>
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
                onEngineReady={(e) => { setEngine(e); engineRef.current = e; }}
                displayControls={false}
                readOnly
              />
              <div className="mage-engine__controls" style={{ marginTop: "8px" }}>
                <button type="button" className="mage-btn--icon" aria-label={isPlaying ? "Pause" : "Play"} onClick={togglePlayPause} disabled={!engine}>
                  {isPlaying ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  )}
                </button>
                <span style={{ fontSize: "11px", color: "var(--mage-cream-40)", marginLeft: "6px" }}>Space to toggle</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Audio</p>
                <input ref={fileInputRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={handleAudioFileChange} />
                <button type="button" className="mage-audio-picker" style={{ width: "100%" }} onClick={() => fileInputRef.current?.click()} disabled={audioUploading}>
                  <span className="mage-audio-picker__label">{audioUploading ? "Uploading…" : "↑ Upload Audio"}</span>
                  {audioFileName && <span className="mage-audio-picker__name">{audioUploading ? "Sharing with viewers…" : audioFileName}</span>}
                </button>
              </div>

              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Your Presets</p>
                {presets.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--mage-muted, #888)" }}>No presets yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto" }}>
                    {presets.map((p) => (
                      <button key={p.id} type="button" className="mage-btn" onClick={() => handlePresetSelect(p)}
                        style={{ textAlign: "left", background: activePreset?.id === p.id ? "var(--mage-accent, #6c63ff)" : undefined }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
            <code
              style={{ flex: 1, background: "var(--mage-cream-05)", border: "1px solid var(--mage-cream-10)", padding: "6px 10px", borderRadius: "4px", fontSize: "12px", wordBreak: "break-all", cursor: "pointer", color: "var(--mage-cream-60)" }}
              onClick={() => navigator.clipboard.writeText(shareUrl)} title="Click to copy"
            >
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
