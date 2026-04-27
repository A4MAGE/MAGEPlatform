import { useEffect, useRef, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

type ProfileRow = {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
};

const Profile = () => {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const email = session?.user?.email ?? "";
  const createdAt = session?.user?.created_at;

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profile")
        .select("user_id, username, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else if (data) {
        setProfile(data as ProfileRow);
        setNameDraft((data as ProfileRow).username ?? "");
      } else {
        const fallback: ProfileRow = {
          user_id: userId,
          username: email ? email.split("@")[0] : null,
          avatar_url: null,
        };
        setProfile(fallback);
        setNameDraft(fallback.username ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, email]);

  const displayName =
    profile?.username?.trim() || (email ? email.split("@")[0] : "guest");
  const initial = (displayName[0] ?? "?").toUpperCase();
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  const saveUsername = async () => {
    if (!supabase || !userId) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setError("Username can't be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("profile")
      .upsert(
        { user_id: userId, username: trimmed },
        { onConflict: "user_id" },
      );
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setProfile((p) => (p ? { ...p, username: trimmed } : p));
    setEditingName(false);
  };

  const onAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !supabase || !userId) return;
    if (!file.type.startsWith("image/")) {
      setError("Avatar must be an image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2 MB.");
      return;
    }
    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      setError(upErr.message);
      return;
    }

    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBusted = `${pub.publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await supabase
      .from("profile")
      .upsert(
        { user_id: userId, avatar_url: cacheBusted },
        { onConflict: "user_id" },
      );
    setUploading(false);
    if (dbErr) {
      setError(dbErr.message);
      return;
    }
    setProfile((p) => (p ? { ...p, avatar_url: cacheBusted } : p));
  };

  return (
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">01</span>
            Profile
          </p>
          <h1 className="mage-title">Account</h1>
        </div>
      </header>

      {loading ? (
        <p className="mage-preset-list__empty">Loading…</p>
      ) : (
        <div className="mage-profile">
          <button
            type="button"
            className="mage-avatar mage-avatar--button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload avatar"
            disabled={uploading}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="mage-avatar__img"
              />
            ) : (
              <span className="mage-avatar__initial">{initial}</span>
            )}
            <span className="mage-avatar__overlay">
              {uploading ? "Uploading…" : "Change"}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onAvatarFile}
          />

          <div className="mage-identity">
            {editingName ? (
              <div className="mage-identity__edit">
                <input
                  type="text"
                  className="mage-input"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={32}
                  autoFocus
                />
                <button
                  type="button"
                  className="mage-btn mage-btn--primary"
                  onClick={saveUsername}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="mage-btn mage-btn--quiet"
                  onClick={() => {
                    setEditingName(false);
                    setNameDraft(profile?.username ?? "");
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mage-identity__row">
                <h2 className="mage-identity__name">{displayName}</h2>
                <button
                  type="button"
                  className="mage-btn mage-btn--quiet mage-btn--tiny"
                  onClick={() => setEditingName(true)}
                >
                  Edit
                </button>
              </div>
            )}
            <p className="mage-identity__email">{email}</p>
          </div>

          <dl className="mage-profile-meta">
            <div>
              <dt>Member since</dt>
              <dd>{memberSince}</dd>
            </div>
          </dl>

          {error && <p className="mage-profile__error">{error}</p>}

        </div>
      )}
    </div>
  );
};

export default Profile;
