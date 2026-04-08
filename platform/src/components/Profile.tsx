import { useEffect, useState } from "react";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

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

  return (
    <div className="dashboard-container">
      <div className="content-center-card">
        <h1>Profile</h1>
        <h2>{username}</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>{email}</p>

        <div className="account-controls">
          <span>{presets.length} preset{presets.length === 1 ? "" : "s"}</span>
        </div>

        <button className="link-button" onClick={signOut}>
          Sign Out
        </button>
      </div>

      <div className="content-center-card" style={{ minWidth: "280px" }}>
        <h2 style={{ margin: 0 }}>My Presets</h2>
        {loading ? (
          <p>Loading…</p>
        ) : presets.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            No presets yet. Create one from the Player page.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%" }}>
            {presets.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Profile;
