import { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import "./Profile.css";

type Preset = {
  id: number;
  name: string;
  description?: string;
  likes?: number;
  username?: string;
};

const Profile = () => {
  const { session, signOut } = UserAuth();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = session?.user?.id;
  const email = session?.user?.email ?? "guest";

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }
    supabase
      .from("preset_with_username")
      .select("*")
      .eq("user_id", userId)
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data) setPresets(data);
        setLoading(false);
      });
  }, [userId]);

  const username = presets[0]?.username ?? email.split("@")[0];
  const presetCount = presets.length;

  return (
    <div className="dashboard-container">
      <div className="content-center-card profile-card">
        <h1>Profile</h1>
        <p className="profile-username">{username}</p>
        <p className="profile-email">{email}</p>
        <p className="profile-stat">
          {presetCount} preset{presetCount === 1 ? "" : "s"}
        </p>
        <button
          className="link-button profile-signout"
          onClick={signOut}
          type="button"
        >
          Sign Out
        </button>
      </div>

      <div className="content-center-card profile-presets">
        <h2>My Presets</h2>
        {loading ? (
          <p className="profile-presets-empty">Loading…</p>
        ) : presetCount === 0 ? (
          <p className="profile-presets-empty">
            No presets yet. Create one from the Player page.
          </p>
        ) : (
          <ul className="profile-presets-list">
            {presets.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
