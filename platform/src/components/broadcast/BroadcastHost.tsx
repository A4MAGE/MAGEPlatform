import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useBlocker } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import EnginePlayer from "../mage engine/EnginePlayer";
import { openHostChannel, type PublishFn, type CloseFn } from "../../lib/broadcastChannel";
import type { MAGEEngineAPI } from "@notrac/mage";

type Preset = { id: number; name: string; scene_data: object; thumbnail_url?: string };

const BroadcastHost = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { session } = UserAuth();
  const navigate = useNavigate();

  const [engine, setEngine] = useState<MAGEEngineAPI | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<Preset | null>(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [loadedAudioUrl, setLoadedAudioUrl] = useState<string | undefined>(undefined);
  const [viewerAudioUrl, setViewerAudioUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishRef = useRef<PublishFn | null>(null);
  const closeChannelRef = useRef<CloseFn | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, []);

  // Load user's presets once on mount
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user) return;
    supabase
      .from("preset")
      .select("id, name, scene_data, thumbnail_url")
      .eq("user_id", sessionRef.current.user.id)
      .then(({ data, error: e }: { data: any; error: any }) => {
        if (!e && data) setPresets(data);
      });
  }, []);

  // Create the room row and open channel on mount — deps intentionally omit session
  // to prevent auth token refreshes from re-running this and killing the broadcast
  useEffect(() => {
    if (!supabase || !sessionRef.current?.user || !roomId) return;

    let active = true;
    const defaultTitle = `${sessionRef.current.user.email?.split("@")[0]}'s room`;

    supabase
      .from("broadcast_room")
      .upsert({ id: roomId, host_user_id: sessionRef.current!.user.id, title: defaultTitle, is_active: true }, { onConflict: "id" })
      .then(({ error: e }: { error: any }) => {
        if (!active) return;
        if (e) { setError(`Could not create room: ${e.message}`); return; }
        const { publish, close } = openHostChannel(roomId);
        publishRef.current = publish;
        closeChannelRef.current = close;
        setInitialized(true);
      });

    return () => {
      active = false;
      stopBroadcast(false);
    };
  }, [roomId]); // session intentionally excluded — see comment above

  // Periodic playback sync while playing
  useEffect(() => {
    if (!isPlaying || !engine || !publishRef.current) return;

    playbackIntervalRef.current = window.setInterval(() => {
      publishRef.current?.({
        type: "playback",
        playing: true,
        currentTime: engine.getAudioTime(),
      });
    }, 500);

    return () => {
      if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, engine]);

  // Block in-app navigation away from the host page while live
  useBlocker(
    ({ currentLocation, nextLocation }) =>
      initialized &&
      currentLocation.pathname !== nextLocation.pathname &&
      !window.confirm("You're still live. Leaving will stop the broadcast — are you sure?")
  );

  // Reconnect Supabase channel when tab becomes visible again (browser throttles background WS)
  useEffect(() => {
    if (!initialized || !roomId) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !closeChannelRef.current) {
        const { publish, close } = openHostChannel(roomId);
        publishRef.current = publish;
        closeChannelRef.current = close;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [initialized, roomId]);

  // Warn on browser tab close / reload
  useEffect(() => {
    if (!initialized) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [initialized]);

  const stopBroadcast = (navigate_away = true) => {
    if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    publishRef.current?.({ type: "end" });
    closeChannelRef.current?.();
    if (supabase && roomId) {
      supabase.from("broadcast_room").update({ is_active: false }).eq("id", roomId);
    }
    if (navigate_away) navigate("/broadcast");
  };

  const handlePresetSelect = (preset: Preset) => {
    setActivePreset(preset);
    publishRef.current?.({ type: "preset", presetData: preset.scene_data, presetId: preset.id });
    // Update room row so late joiners see current preset
    if (supabase && roomId) {
      supabase
        .from("broadcast_room")
        .update({ current_preset_id: preset.id, current_preset_data: preset.scene_data, updated_at: new Date().toISOString() })
        .eq("id", roomId);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setAudioFileName(file.name);
    setLoadedAudioUrl(blobUrl);
  };

  const handleShareAudio = () => {
    const url = viewerAudioUrl.trim();
    if (!url) return;
    publishRef.current?.({ type: "audio", audioUrl: url });
    if (supabase && roomId) {
      supabase
        .from("broadcast_room")
        .update({ current_audio_url: url, updated_at: new Date().toISOString() })
        .eq("id", roomId);
    }
  };

  const handlePlay = () => {
    engine?.play();
    setIsPlaying(true);
    publishRef.current?.({ type: "playback", playing: true, currentTime: engine?.getAudioTime() ?? 0 });
  };

  const handlePause = () => {
    engine?.pause();
    setIsPlaying(false);
    publishRef.current?.({ type: "playback", playing: false, currentTime: engine?.getAudioTime() ?? 0 });
  };

  const shareUrl = `${window.location.origin}/broadcast/room/${roomId}`;

  if (error) return <div className="mage-page"><p className="mage-body" style={{ color: "red" }}>{error}</p></div>;

  return (
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow"><span className="mage-eyebrow__num">05</span>Broadcast</p>
          <h1 className="mage-title">You're Live</h1>
        </div>
        <button type="button" className="mage-btn" onClick={() => stopBroadcast(true)}
          style={{ background: "#c0392b" }}>
          Stop Broadcasting
        </button>
      </header>

      {initialized && (
        <>
          <div style={{ marginBottom: "16px" }}>
            <p className="mage-body" style={{ fontSize: "12px", color: "var(--mage-muted, #888)" }}>
              Share this link with viewers:
            </p>
            <code
              style={{
                background: "var(--mage-surface-2, #222)",
                padding: "6px 10px",
                borderRadius: "4px",
                fontSize: "13px",
                wordBreak: "break-all",
                display: "block",
                cursor: "pointer",
              }}
              onClick={() => navigator.clipboard.writeText(shareUrl)}
              title="Click to copy"
            >
              {shareUrl}
            </code>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
            {/* Engine */}
            <div>
              <EnginePlayer
                preset={activePreset?.scene_data ?? null}
                audioSource={loadedAudioUrl}
                onEngineReady={setEngine}
                displayControls={false}
                readOnly
              />
              <div className="mage-engine__controls" style={{ marginTop: "8px" }}>
                <button type="button" className="mage-btn--icon" aria-label="Play" onClick={handlePlay} disabled={!engine}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </button>
                <button type="button" className="mage-btn--icon" aria-label="Pause" onClick={handlePause} disabled={!engine}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Controls panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Audio file picker */}
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Audio</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  style={{ display: "none" }}
                  onChange={handleAudioFileChange}
                />
                <button
                  type="button"
                  className="mage-audio-picker"
                  style={{ width: "100%", marginBottom: "10px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="mage-audio-picker__label">Audio File</span>
                  <span className={"mage-audio-picker__name" + (audioFileName ? "" : " mage-audio-picker__name--empty")}>
                    {audioFileName || "No file selected — click to choose"}
                  </span>
                </button>
                <p className="mage-body" style={{ fontSize: "11px", color: "var(--mage-muted, #888)", marginBottom: "6px" }}>
                  Viewer audio URL (public link)
                </p>
                <input
                  type="text"
                  className="mage-input"
                  placeholder="https://… (for viewers)"
                  value={viewerAudioUrl}
                  onChange={(e) => setViewerAudioUrl(e.target.value)}
                  style={{ width: "100%", marginBottom: "6px" }}
                />
                <button type="button" className="mage-btn" onClick={handleShareAudio} style={{ width: "100%" }}>
                  Share Audio with Viewers
                </button>
              </div>

              {/* Preset picker */}
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Your Presets</p>
                {presets.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "var(--mage-muted, #888)" }}>No presets yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "320px", overflowY: "auto" }}>
                    {presets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="mage-btn"
                        onClick={() => handlePresetSelect(p)}
                        style={{
                          textAlign: "left",
                          background: activePreset?.id === p.id ? "var(--mage-accent, #6c63ff)" : undefined,
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!initialized && <p className="mage-body">Setting up room…</p>}
    </div>
  );
};

export default BroadcastHost;
