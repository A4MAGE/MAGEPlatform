import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishRef = useRef<PublishFn | null>(null);
  const closeChannelRef = useRef<CloseFn | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);

  // Load user's presets
  useEffect(() => {
    if (!supabase || !session?.user) return;
    supabase
      .from("preset")
      .select("id, name, scene_data, thumbnail_url")
      .eq("user_id", session.user.id)
      .then(({ data, error: e }: { data: any; error: any }) => {
        if (!e && data) setPresets(data);
      });
  }, [session]);

  // Create the room row and open channel on mount
  useEffect(() => {
    if (!supabase || !session?.user || !roomId) return;

    const defaultTitle = `${session.user.email?.split("@")[0]}'s room`;
    setRoomTitle(defaultTitle);

    supabase
      .from("broadcast_room")
      .upsert({
        id: roomId,
        host_user_id: session.user.id,
        title: defaultTitle,
        is_active: true,
      }, { onConflict: "id" })
      .then(({ error: e }: { error: any }) => {
        if (e) { setError(`Could not create room: ${e.message}`); return; }
        const { publish, close } = openHostChannel(roomId);
        publishRef.current = publish;
        closeChannelRef.current = close;
        setInitialized(true);
      });

    return () => {
      stopBroadcast(false);
    };
  }, [roomId, session]);

  // Periodic playback sync while playing
  useEffect(() => {
    if (!isPlaying || !engine || !publishRef.current) return;

    playbackIntervalRef.current = window.setInterval(() => {
      publishRef.current?.({
        type: "playback",
        playing: true,
        currentTime: engine.getAudioTime(),
      });
    }, 2000);

    return () => {
      if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, engine]);

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

  const handleAudioLoad = () => {
    if (!audioUrl.trim()) return;
    publishRef.current?.({ type: "audio", audioUrl });
    if (supabase && roomId) {
      supabase
        .from("broadcast_room")
        .update({ current_audio_url: audioUrl, updated_at: new Date().toISOString() })
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
                audioSource={audioUrl || undefined}
                onEngineReady={setEngine}
                displayControls={false}
                readOnly
              />
              <div className="mage-engine__controls" style={{ marginTop: "8px" }}>
                <button type="button" className="mage-btn mage-btn--primary" onClick={handlePlay} disabled={!engine}>Play</button>
                <button type="button" className="mage-btn mage-btn--primary" onClick={handlePause} disabled={!engine}>Pause</button>
              </div>
            </div>

            {/* Controls panel */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Audio URL */}
              <div>
                <p className="mage-body" style={{ fontSize: "12px", marginBottom: "6px" }}>Audio URL</p>
                <input
                  type="text"
                  className="mage-input"
                  placeholder="https://…"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  style={{ width: "100%", marginBottom: "6px" }}
                />
                <button type="button" className="mage-btn" onClick={handleAudioLoad} style={{ width: "100%" }}>
                  Load Audio
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
