import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
// @ts-ignore
import Search from "@search/search-bar-main";

const Explore = () => {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from("preset_with_username")
      .select("*")
      .then(({ data, error }: { data: any; error: any }) => {
        if (!error && data) setPresets(data);
        setLoading(false);
      });
  }, []);

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
        <p className="mage-body">
          {loading ? "Loading…" : `${presets.length} total`}
        </p>
      </header>

      <div className="mage-search">
        <Search data={presets} onSelect={handleSelect} />
      </div>
    </div>
  );
};

export default Explore;
