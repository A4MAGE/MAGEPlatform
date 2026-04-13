import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

const MyPresets = () => {
  const [presets, setPresets] = useState<any[]>([]);
  const { session } = UserAuth();
  const userID = session?.user?.id;

  useEffect(() => {
    if (userID) {
      const fetchPresets = async () => {
        const { data, error } = await supabase
          .from("preset")
          .select("*")
          .eq("user_id", userID);
        if (!error && data) setPresets(data);
      };
      fetchPresets();
    }
  }, [userID]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("preset").delete().eq("id", id);
    if (!error) {
      setPresets(prev => prev.filter((p) => p.id !== id));
    }
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
        {presets.length > 0 ? (
          <ul className="mage-preset-list">
            {presets.map((p, index) => (
              <li key={p.id} className="mage-preset-item">
                <span className="mage-preset-list__num">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
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