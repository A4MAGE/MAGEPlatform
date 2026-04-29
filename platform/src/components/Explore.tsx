import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

function gradientForName(name = "") {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < name.length; i++) {
    h1 = (h1 * 31 + name.charCodeAt(i)) & 0xffff;
    h2 = (h2 * 17 + name.charCodeAt(i)) & 0xffff;
  }
  const hue1 = h1 % 360;
  const hue2 = (hue1 + 60 + (h2 % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1},55%,28%), hsl(${hue2},60%,18%))`;
}

const Explore = () => {
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase
      .from("preset_with_username")
      .select("*")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data) setPresets(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.username?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }, [presets, query]);

  const handleSelect = (item: any) => {
    navigate("/player", { state: { preset: item } });
  };

  return (
    <div className="mage-page">
      <header className="mage-page__header">
        <div className="mage-page__title-group">
          <p className="mage-eyebrow">
            <span className="mage-eyebrow__num">02</span>
            Explore
          </p>
          <h1 className="mage-title">Browse Presets</h1>
        </div>
        <p className="mage-body">{loading ? "Loading…" : `${presets.length} presets`}</p>
      </header>

      <div className="mage-explore-search">
        <input
          type="text"
          className="mage-explore-search__input"
          placeholder="Search by name, author, or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="mage-explore-empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="mage-explore-empty">No presets match "{query}"</div>
      ) : (
        <div className="mage-explore-grid">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className="mage-explore-card"
              onClick={() => handleSelect(item)}
            >
              <div className="mage-explore-card__thumb">
                {item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt={item.name} />
                ) : (
                  <div className="mage-explore-card__thumb-placeholder" style={{ background: gradientForName(item.name) }} />
                )}
              </div>
              <div className="mage-explore-card__info">
                <span className="mage-explore-card__name">{item.name}</span>
                {item.username && (
                  <span className="mage-explore-card__author">{item.username}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
