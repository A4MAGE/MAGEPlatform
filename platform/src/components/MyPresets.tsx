import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

const MyPresets = () => {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = UserAuth();
  const userID = session?.user?.id;

  useEffect(() => {
    if (!supabase) return;
    if (!userID) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("preset")
        .select("*")
        .eq("user_id", userID);
      if (error) {
        console.error("MyPresets fetch failed:", error, "userID=", userID);
      } else {
        console.log(`MyPresets: fetched ${data?.length ?? 0} for user ${userID}`);
        setPresets(data ?? []);
      }
      setLoading(false);
    })();
  }, [userID]);

  const handleDelete = async (id: number) => {
    if (!supabase) return;
    // Delete from the base table — views are not deletable.
    const { error } = await supabase.from("preset").delete().eq("id", id);
    if (error) {
      console.error("MyPresets delete failed:", error);
      return;
    }
    setPresets(prev => prev.filter((p) => p.id !== id));
  };

  return (
    <main className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">{presets.length}</span> Presets Saved
          </p>
          <h1 className="mage-title">My Presets</h1>
        </div>
      </header>

      <div className="mage-stack mage-stack--lg">
        {loading ? (
          <div className="mage-panel">
            <p className="mage-preset-list__empty">Loading presets…</p>
          </div>
        ) : !userID ? (
          <div className="mage-panel">
            <p className="mage-preset-list__empty">Please sign in to see your presets.</p>
          </div>
        ) : presets.length > 0 ? (
          <ul className="mage-preset-list">
            {presets.map((p, index) => (
              <li key={p.id} className="mage-preset-item">
                <span className="mage-preset-list__num">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {p.thumbnail_url && (
                  <img
                    src={p.thumbnail_url}
                    alt={p.name}
                    className="mage-preset-thumb"
                    loading="lazy"
                  />
                )}
                <div className="mage-preset-info">
                  <span className="mage-preset-name">{p.name}</span>
                  <span className="mage-tagline">TAG: <strong>{p.tag}</strong></span>
                </div>
                <button 
                  className="mage-btn mage-btn--quiet delete-action" 
                  onClick={() => handleDelete(p.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mage-panel">
            <p className="mage-preset-list__empty">
              No presets found.
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default MyPresets;