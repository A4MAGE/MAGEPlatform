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
  const presetCount = presets.length;

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
        <button
          type="button"
          className="mage-btn mage-btn--quiet"
          onClick={signOut}
        >
          Sign Out
        </button>
      </header>

      <div className="mage-grid-2">
        <div className="mage-stack mage-stack--lg">
          <div className="mage-identity">
            <h2 className="mage-identity__name">{username}</h2>
            <p className="mage-identity__email">{email}</p>
          </div>
          <div>
            <p className="mage-eyebrow">
              <span className="mage-eyebrow__num">{presetCount.toString().padStart(2, "0")}</span>
              Presets Created
            </p>
          </div>
        </div>

        <div className="mage-stack">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">02</span>
            My Presets
          </p>
          {loading ? (
            <p className="mage-preset-list__empty">Loading…</p>
          ) : presetCount === 0 ? (
            <p className="mage-preset-list__empty">
              No presets yet. Create one from the Player page.
            </p>
          ) : (
            <ul className="mage-preset-list">
              {presets.map((p, i) => (
                <li key={p.id}>
                  <span className="mage-preset-list__num">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span>{p.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
